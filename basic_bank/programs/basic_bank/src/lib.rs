use anchor_lang::prelude::*;
use anchor_lang::solana_program::program as solana_program;
use anchor_lang::solana_program::rent::Rent;
use anchor_lang::solana_program::system_instruction;

declare_id!("2BwB9RyENHoBsNKnHyQ53w7KAM2FrRJpcqHumvfdCTgN");

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

        let user = &ctx.accounts.user.key();
        let bank = &ctx.accounts.bank.key();

        let transfer_ix = system_instruction::transfer(user, bank, amount);
        solana_program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.bank.to_account_info(),
            ],
        )?;

        let user_account = &mut ctx.accounts.user_account;
        user_account.balance = user_account
            .balance
            .checked_add(amount)
            .ok_or(BankError::Overflow)?;

        let bank = &mut ctx.accounts.bank;
        bank.total_deposits = bank
            .total_deposits
            .checked_add(amount)
            .ok_or(BankError::Overflow)?;

        msg!("Deposited {:?} lamports for {:?}", amount, user);
        Ok(())
    }

    pub fn get_balance(ctx: Context<GetBalance>) -> Result<u64> {
        let user_account = &ctx.accounts.user_account;
        let balance = user_account.balance;

        msg!("Balance for {}: {} lamports", user_account.owner, balance);
        Ok(balance)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, BankError::ZeroAmount);

        let bank = &mut ctx.accounts.bank;
        let user_account = &mut ctx.accounts.user_account;
        let user = ctx.accounts.user.key();

        require!(
            user_account.balance >= amount,
            BankError::InsufficientBalance
        );

        user_account.balance = user_account
            .balance
            .checked_sub(amount)
            .ok_or(BankError::Underflow)?;

        bank.total_deposits = bank
            .total_deposits
            .checked_sub(amount)
            .ok_or(BankError::Underflow)?;

        let rent = Rent::get()?;
        let bank_account_info = ctx.accounts.bank.to_account_info();
        let minimum_balance = rent.minimum_balance(bank_account_info.data_len());

        let available_lamports = bank_account_info.lamports();
        let transfer_amount = amount.min(available_lamports.saturating_sub(minimum_balance));

        **bank_account_info.try_borrow_mut_lamports()? -= transfer_amount;
        **ctx.accounts.user.try_borrow_mut_lamports()? += transfer_amount;

        msg!("Withdrawn {} lamports for {}", amount, user);
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
pub struct Deposit<'info> {
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

#[derive(Accounts)]
pub struct GetBalance<'info> {
    pub bank: Account<'info, Bank>,

    #[account(seeds = [b"user-account", user.key().as_ref()],bump,constraint = user_account.owner==user.key()@ BankError::UnauthorizedAccess)]
    pub user_account: Account<'info, UserAccount>,

    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(mut, seeds = [b"user-account",user.key().as_ref()], bump, constraint = user_account.owner==user.key() @BankError::UnauthorizedAccess)]
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
