use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};

declare_id!("9u5LvD3nY4cT26CNr5X8uUBnoXNvuQAhWRypdT9VhMPr");

const TOKENS_PER_SOL: u64 = 100;
const SUPPLY_CAP: u64 = 1000e9 as u64;

#[program]
pub mod token_sale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.admin_config.admin = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn mint(ctx: Context<MintTokens>, lamports: u64) -> Result<()> {
        let amount =  lamports.checked_mul(TOKENS_PER_SOL).ok_or(Errors::Overflow)?;

        let current_supply = ctx.accounts.mint.supply;
        let new_supply = current_supply.checked_add(amount).ok_or(Errors::Overflow)?;

        require!(new_supply <= SUPPLY_CAP, Errors::SupplyLimit);

        let transfer_instruction =  Transfer{
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
        };

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );
        transfer(cpi_context, lamports)?;

        // bumps 由 Anchor 根据账户约束中的 bump 自动注入，无需在 MintTokens 里声明
        let bump = ctx.bumps.mint;
        // signer_seeds 类型: &[&[&[u8]]] = 引用→(PDA列表→(每个PDA的种子列表→每个种子&[u8]))
        let signer_seeds: &[&[&[u8]]] = &[&[b"token_mint", &[bump]]];

        let mint_to_instruction = MintTo{
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.buyer_ata.to_account_info(),
            authority: ctx.accounts.mint.to_account_info(),
        };

        // CpiContext::new_with_signer 用于「让本程序代表某个 PDA 签名」。
        // 典型场景：1) 代表 treasury PDA 转 SOL/关账户 2) 代表 mint/authority PDA 铸币/转 token（本例）
        // 3) 任何内层指令要求「本程序拥有的 PDA」作为 signer 时。不需要 PDA 签名时用 CpiContext::new。
        // CPI 三件套：被调程序、指令、signer_seeds（只传要代为签名的 PDA 的 seeds，可多个 PDA）。
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            mint_to_instruction,
            signer_seeds,
        );
        mint_to(cpi_context, amount)?;

        Ok(())
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        let treasury_balance = ctx.accounts.treasury.lamports();
        require!(treasury_balance >= amount, Errors::InsufficientFunds);

        let bump = ctx.bumps.treasury;
        let signer_seeds :&[&[&[u8]]] = &[&[b"treasury".as_ref(), &[bump]]];

        let transfer_instruction = Transfer{
            from: ctx.accounts.treasury.to_account_info(),
            to: ctx.accounts.admin.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
            signer_seeds,
        );
        transfer(cpi_context, amount)?;

        Ok(())
    }
}

// --- admin vs admin_config 说明 ---
// admin 用 Signer：只验证「该地址在本交易中签了名」，不反序列化账户数据，不做完整性检查。
// admin_config 用 Account<AdminConfig>：会加载该地址的账户、反序列化成 AdminConfig。
// 两个都要传：admin =「当前在签名的人」，admin_config =「存『谁是 admin』这条配置的账户」。
// 客户端传两个 publicKey：一个是签名者地址，一个是配置账户的地址（两者不是同一个东西）。
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8+AdminConfig::INIT_SPACE,
    )]
    pub admin_config: Account<'info, AdminConfig>,

    #[account(
        init,
        payer = admin,
        seeds = [b"token_mint"],
        bump,
        mint::decimals = 9,
        mint::authority = mint.key(),
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA for treasury
    #[account(
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// 持久化「谁是 admin」的链上配置。目的：让 admin 可配置、可更换（动态），
// 后续指令（如 withdraw_funds）通过读取此账户做 constraint 校验当前 Signer 是否为合法 admin。
#[account]
#[derive(InitSpace)] // This is a derive attribute macro provided by anchor,
// it calculates the space needed for the account and gives us access to AdminConfig::INIT_SPACE, as used above
pub struct AdminConfig {
    pub admin: Pubkey,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = buyer,
    )]
    pub buyer_ata: Account<'info, TokenAccount>,

    /// CHECK: PDA for treasury
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// 为何 withdraw_funds 里还要传 admin_config？链上不是已经持久化了吗？
// Solana 执行模型：程序不会自己去「查链上数据」，只能使用本笔交易里传入的账户。
// 不传 admin_config，程序就拿不到那个账户，无法反序列化，也就做不了 admin_config.admin == admin.key()。
// 传 admin_config = 告诉运行时「把该地址的账户交给程序」，程序才能读出里面的 admin 再与 Signer 比较。
//
// 为何不能传「非法的 Signer + 非法的 admin_config」蒙混过关？
// Account<'info, AdminConfig> 会校验该账户的 owner 必须是本程序（declare_id!）。
// 自己造的账户 owner 是 System 或别的程序，过不了校验；合法的 admin_config 只能来自 initialize 里
// 用 init 创建的那类「程序拥有的账户」，只有程序能创建，无法伪造。
#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        constraint = admin_config.admin == admin.key()
        @ Errors::UnauthorizedAccess,
    )]
    pub admin_config: Account<'info, AdminConfig>,

    /// CHECK: PDA for treasury
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum Errors {
    #[msg("Max token supply limit reached")]
    SupplyLimit,

    #[msg("Math overflow")]
    Overflow,

    #[msg("Only admin can withdraw")]
    UnauthorizedAccess,

    #[msg("Not enough SOL in treasury")]
    InsufficientFunds,
}