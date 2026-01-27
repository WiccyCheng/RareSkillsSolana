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

        let bump = ctx.bumps.mint;
        let signer_seeds: &[&[&[u8]]] = &[&[b"token_mint", &[bump]]];

        let mint_to_instruction = MintTo{
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.buyer_ata.to_account_info(),
            authority: ctx.accounts.mint.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            mint_to_instruction,
            signer_seeds,
        );
        mint_to(cpi_context, amount)?;

        Ok(())
    }
}

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

// Stores the admin public key
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