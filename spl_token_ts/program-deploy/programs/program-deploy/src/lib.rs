use anchor_lang::prelude::*;

declare_id!("GGtwujGb5v78R7DNS3Vnsc2AL3oBa6BgkcNHwb7c4rHd");

#[program]
pub mod program_deploy {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
