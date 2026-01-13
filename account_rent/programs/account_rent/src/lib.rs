use anchor_lang::prelude::*;
use anchor_lang::solana_program::rent as rent_module;

declare_id!("4ePP7XFD4gqXbg1EZTKpcysSHGraxbchGH36cHy7dUNW");

#[program]
pub mod account_rent {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let cost_of_my_account = rent_module::ACCOUNT_STORAGE_OVERHEAD as f64
                                    * rent_module::DEFAULT_LAMPORTS_PER_BYTE_YEAR as f64
                                    * rent_module::DEFAULT_EXEMPTION_THRESHOLD as f64;
        
        msg!("Account rent cost calculation: {}", cost_of_my_account);
        msg!("Created account with space: {}", 10241);
        
        Ok(())
    }

    pub fn increase_account_size(ctx: Context<IncreaseAccountSize>) -> Result<()> {
        msg!("Increasing account size using realloc");
        msg!("New account size after realloc");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct IncreaseAccountSize<'info> {
    #[account(mut, realloc = size_of::<Foo>() + 8 + 1000, realloc::payer = signer, realloc::zero = false, seeds = [], bump)]
    pub my_storage: Account<'info, Foo>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 10241)]
    pub foo: Account<'info, Foo>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Foo {
    pub data: Vec<u8>,
}
