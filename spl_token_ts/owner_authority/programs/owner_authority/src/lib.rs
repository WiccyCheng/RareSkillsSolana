use anchor_lang::prelude::*;

declare_id!("5oZKUquafDGkfQCJZr4TsXAH1TDz3ZYq65qYBq99Cbtt");

#[program]
pub mod owner_authority {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
