use anchor_lang::prelude::*;

declare_id!("3f6vYrNvkyo8nRDbXpMGDaWyANuMZtLpA1xqk9Fn1dLc");

#[program]
pub mod basic_storage {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init,
              payer = signer,
              space = size_of::<MyStorage>()+8,
              seeds=[],
               bump)
    ]
    pub my_storage: Account<'info, MyStorage>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyStorage {
    pub x: i64,
    pub y: i64,
}
