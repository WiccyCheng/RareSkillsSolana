use anchor_lang::prelude::*;

declare_id!("ED4c4c1yG5nSRpaxVGowUHUQyTwAZRnpD6FjojUT79bC");

#[program]
pub mod close_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn delete(ctx: Context<Delete>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<ThePda>() + 8, seeds = [],bump)]
    pub the_pda: Account<'info, ThePda>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Delete<'info> {
    #[account(mut, close = signer)]
    pub the_pda: Account<'info, ThePda>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
pub struct ThePda {
    pub x: u32,
}
