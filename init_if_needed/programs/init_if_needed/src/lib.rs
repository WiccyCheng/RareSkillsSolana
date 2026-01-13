use anchor_lang::prelude::*;

declare_id!("9K49Z7SfBRyPP1q2whkvKGVJxDUCD9b6ifer3LCx5MQy");

#[program]
pub mod init_if_needed {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let current_counter = ctx.accounts.my_pda.counter;
        ctx.accounts.my_pda.counter = current_counter + 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init_if_needed, payer = signer, space = size_of::<MyPDA>() + 8, seeds = [], bump)]
    pub my_pda: Account<'info, MyPDA>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyPDA {
    pub counter: u64,
}