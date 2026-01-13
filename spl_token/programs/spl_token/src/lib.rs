use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("FNpZLfWhfkmZo57CnBL8tGr6nHEBz3SYSz2ea4tdPACs");

#[program]
pub mod spl_token {
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
}

#[derive(Accounts)]
pub struct CreateMint {
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
