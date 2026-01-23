use anchor_lang::prelude::*;

declare_id!("315ptnkw9CcvpV8QCMnYv4fsJuQSFVwvPiCQGz8PZv8o");

#[program]
pub mod change_owner {
    use anchor_lang::solana_program::example_mocks::solana_sdk::system_program;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn change_owner(ctx: Context<ChangeOwner>) -> Result<()> {
        let account_info = &mut ctx.accounts.my_storage.to_account_info();
        account_info.assign(&system_program::ID);
        let res = account_info.resize(0);

        if !res.is_ok() {
            return err!(Err::ReallocFailed);
        }

        Ok(())
    }
}

#[error_code]
pub enum Err {
    #[msg("realloc failed")]
    ReallocFailed,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8 + size_of::<MyStorage>(), seeds = [], bump)]
    pub my_storage: Account<'info, MyStorage>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ChangeOwner<'info> {
    #[account(mut)]
    pub my_storage: Account<'info, MyStorage>,
}

#[account]
pub struct MyStorage {
    x: u64,
}
