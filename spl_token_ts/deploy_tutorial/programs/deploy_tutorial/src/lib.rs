use anchor_lang::prelude::*;

declare_id!("BrrUECnTuv1wyhsPFN7ejEXFsfPvChWhxvtqhYaySLz6");

#[program]
pub mod deploy_tutorial {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
