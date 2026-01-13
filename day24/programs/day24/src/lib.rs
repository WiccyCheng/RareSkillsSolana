use anchor_lang::prelude::*;

declare_id!("8REdvBwHwfiWTRpDAYN1pGpaR6JLHLLq6JuLA3ceqd8f");

#[program]
pub mod day24 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn update_value(ctx: Context<UpdateValue>, new_value: u64) -> Result<()> {
        ctx.accounts.my_storage.x = new_value;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init,
            payer = foo,
            space = 8 + size_of::<MyStorage>(),
            seeds = [],
            bump)]
    pub my_storage: Account<'info, MyStorage>,

    #[account(mut)]
    pub foo: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateValue<'info> {
    #[account(mut, seeds = [], bump)]
    pub my_storage: Account<'info, MyStorage>,

    pub foo: Signer<'info>,
}

#[account]
pub struct MyStorage {
    pub x: u64,
}
