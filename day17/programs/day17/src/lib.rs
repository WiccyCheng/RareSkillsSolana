use anchor_lang::prelude::*;

declare_id!("Gbg12556Bh1vshvhUpRr9TyuysEwpVPGSq5kLDF1K53H");

#[program]
pub mod day17 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    // ****************************
    // *** THIS FUNCTION IS NEW ***
    // ****************************
    pub fn set(ctx: Context<Set>, new_x: u64) -> Result<()> {
        let my_storage = &mut ctx.accounts.my_storage;
        my_storage.x = new_x;
        Ok(())
    }

    pub fn print_x(ctx: Context<PrintX>) -> Result<()> {
        let my_storage = &ctx.accounts.my_storage;
        msg!("The value of x is: {}", my_storage.x);
        Ok(())
    }

    pub fn read_and_increment(ctx: Context<Set>) -> Result<u64> {
        let my_storage = &mut ctx.accounts.my_storage;
        let current_x = my_storage.x;
        msg!("Current x: {}", current_x);
        my_storage.x += 1;
        msg!("Incremented x to: {}", my_storage.x);
        Ok(current_x)
    }
}

#[derive(Accounts)]
pub struct PrintX<'info> {
    // PDA to hold the storage. Deterministic address with static seed.
    #[account(seeds = [b"my_storage"], bump)]
    pub my_storage: Account<'info, MyStorage>,
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut, seeds = [b"my_storage"], bump)]
    pub my_storage: Account<'info, MyStorage>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        // 8 for discriminator + 8 for u64 `x`
        space = 8 + 8,
        seeds = [b"my_storage"],
        bump
    )]
    pub my_storage: Account<'info, MyStorage>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyStorage {
    x: u64,
}