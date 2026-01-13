use anchor_lang::prelude::*;

declare_id!("FAD4ZZe98XGxw2b554vLvPVDMi23nStYrGLNytxdXh86");

#[program]
pub mod day_1 {
    use super::*;

    pub fn initialize2(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello Wiccy.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
