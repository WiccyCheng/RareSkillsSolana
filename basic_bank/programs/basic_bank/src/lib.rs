use anchor_lang::prelude::*;
use anchor_lang::solana_program::rent::Rent;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program as solana_program;

declare_id!("7HyG7mr54ZgtU99jAYbap6s6979Mg3ENvfaif29DH4Qa");

#[program]
pub mod basic_bank {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let bank = &mut ctx.accounts.bank;
        bank.total_deposits = 0;
        
        msg!("Bank initialized");
        Ok(())
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.owner = ctx.accounts.user.key();
        user_account.balance = 0;
        
        msg!("User account created for {:?}", user_account.owner);
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, BankError::ZeroAmount);

        let user = & ctx.accounts.user.key();
        let bank = & ctx.accounts.bank.key();

        let transfer_ix = system_instruction::transfer(user, bank, amount);
        solana_program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.bank.to_account_info(),
            ],
        )?;

        let user_account = &mut ctx.accounts.user_account;
        user_account.balance = user_account.balance.checked_add(amount).ok_or(BankError::Overflow)?;

        let bank = &mut ctx.accounts.bank;
        bank.total_deposits = bank.total_deposits.checked_add(amount).ok_or(BankError::Overflow)?;

        msg!("Deposited {:?} lamports for {:?}", amount, user);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + Bank::INIT_SPACE)]
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(init, payer = user, space = 8 + UserAccount::INIT_SPACE, seeds = [b"user-account", user.key().as_ref()], bump)]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info>{
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(
        mut, 
        seeds = [b"user-account", user.key().as_ref()], 
        bump, 
        constraint = user_account.owner == user.key() @ BankError::UnauthorizedAccess)]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Bank {
    pub total_deposits: u64,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    pub balance: u64,
}

#[error_code]
pub enum BankError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,

    #[msg("Insufficient balance for withdrawal")]
    InsufficientBalance,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Arithmetic underflow")]
    Underflow,

    #[msg("Insufficient funds in the bank account")]
    InsufficientFunds,

    #[msg("Unauthorized access to user account")]
    UnauthorizedAccess,
}
