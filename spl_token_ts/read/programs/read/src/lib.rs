use anchor_lang::prelude::*;

declare_id!("F7QN3uycjvS1YfmaDaTac7inJLZ5BwDSb8vMfgcGggoK");

#[program]
pub mod read {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
