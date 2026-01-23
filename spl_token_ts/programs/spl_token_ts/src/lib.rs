use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

declare_id!("7eGZP7XyhPLDWWArSMVbY7J1JX52B6GC5qmYrggyimEa");

#[program]
pub mod spl_token_ts {
    use anchor_spl::token::{self, spl_token};

    use super::*;

    pub fn disable_mint_authority(ctx: Context<DisableMintAuthority>) -> Result<()> {
        let cpi_accounts = token::SetAuthority {
            account_or_mint: ctx.accounts.mint.to_account_info(),
            current_authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::set_authority(
            cpi_ctx,
            spl_token::instruction::AuthorityType::MintTokens,
            None,
        )?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct DisableMintAuthority<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
