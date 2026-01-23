use anchor_lang::prelude::*;

declare_id!("EXuFXtDRqyvpfuWoRpcp37VqB7DvdCubh9ejuvWhTcKG");

#[program]
pub mod day15 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // msg!("Greetings from: {:?}", ctx.program_id);
        let mut a = Vec::new();
        a.push(1);
        a.push(2);
        a.push(3);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
