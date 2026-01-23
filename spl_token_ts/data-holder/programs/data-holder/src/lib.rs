use anchor_lang::prelude::*;

declare_id!("DtNHuJPQon5GGCY4rztCFarn2WHkemaoPaDS5xoiZZvQ");

#[program]
pub mod data_holder {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.storage.x = u64::pow(2, 32);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<Storage>() + 8, seeds = [], bump)]
    pub storage: Account<'info, Storage>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Storage {
    pub x: u64,
}
