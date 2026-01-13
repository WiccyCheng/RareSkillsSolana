use anchor_lang::prelude::*;

declare_id!("5DvMHYe5tWwoF969RSJVnjRregKWwBepvFvaentdTyDN");

#[program]
pub mod day4 {
    use super::*;

    pub fn func(ctx: Context<ReturnError>) -> Result<()> {
        msg!("Will this print?");
        return Ok(());
    }
}

#[derive(Accounts)]
pub struct ReturnError {}

#[error_code]
pub enum Day4Error {
    #[msg("AlwaysErrors")]
    AlwaysErrors,
}
