use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::spl_token::instruction::AuthorityType;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("D2JHzuS9izAS2kkP4TQAbhGsVE5GysUYNGc94dptF7uf");

#[program]
pub mod spl_token {
    use anchor_spl::token::SetAuthority;

    use super::*;

    pub fn create_and_mint_account(ctx: Context<CreateMint>) -> Result<()> {
        let mint_amount = 100_000_000_000;
        let mint = ctx.accounts.new_mint.clone();
        let destination_ata = &ctx.accounts.new_ata;
        let authority = ctx.accounts.signer.clone();
        let token_program = ctx.accounts.token_program.clone();

        let mint_to_instruction = MintTo {
            mint: mint.to_account_info(),
            to: destination_ata.to_account_info(),
            authority: authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(token_program.to_account_info(), mint_to_instruction);
        token::mint_to(cpi_ctx, mint_amount)?;

        Ok(())
    }

    pub fn transfer_tokens(ctx: Context<TransferSql>, amount: u64) -> Result<()> {
        let source_data = &ctx.accounts.from_ata;
        let destination_ata = &ctx.accounts.to_ata;
        let authority = &ctx.accounts.from;
        let token_program = &ctx.accounts.token_program;

        let cpi_accounts = Transfer {
            from: source_data.to_account_info().clone(),
            to: destination_ata.to_account_info().clone(),
            authority: authority.to_account_info().clone(),
        };
        let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn get_balance(ctx: Context<GetBalance>) -> Result<()> {
        let ata_pubkey = ctx.accounts.token_account.key();
        let owner = ctx.accounts.token_account.owner;
        let balance = ctx.accounts.token_account.amount;

        msg!("Token Account Address: {}", ata_pubkey);
        msg!("Token Account Owner: {}", owner);
        msg!("Token Account Balance: {}", balance);

        Ok(())
    }

    pub fn disable_mint_authority(ctx: Context<DisableMintAuthority>) -> Result<()> {
        let token_program = &ctx.accounts.token_program;
        let disable_instruction = SetAuthority {
            current_authority: ctx.accounts.signer.to_account_info(),
            account_or_mint: ctx.accounts.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(token_program.to_account_info(), disable_instruction);
        token::set_authority(cpi_ctx, AuthorityType::MintTokens, None)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
            init,
            payer = signer,
            mint::decimals = 9,
            mint::authority = signer,
            mint::freeze_authority = signer,
            seeds = [b"my_mint", signer.key().as_ref()],
            bump
        )]
    pub new_mint: Account<'info, Mint>,

    #[account(
            init,
            payer = signer,
            associated_token::mint = new_mint,
            associated_token::authority = signer,
            )]
    pub new_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferSql<'info> {
    pub from: Signer<'info>,
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetBalance<'info> {
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct DisableMintAuthority<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
