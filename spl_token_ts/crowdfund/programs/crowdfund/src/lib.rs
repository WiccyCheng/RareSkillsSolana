use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::system_program;
use solana_program::pubkey::Pubkey;
use std::str::FromStr;

declare_id!("2ymXxgTxjFT9RhMBSFwNRFiTXypJu1Y77CRW3DRGgeow");

#[program]
pub mod crowdfund {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let Initialized_pda = &mut ctx.accounts.pda;
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.signer.to_account_info().clone(),
                to: ctx.accounts.pda.to_account_info().clone(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        ctx.accounts.pda.sub_lamports(amount)?;
        ctx.accounts.signer.add_lamports(amount+1)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(init, payer = signer, space = 8 + size_of::<Pda>(), seeds = [], bump)]
    pub pda: Account<'info, Pda>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub pda: Account<'info, Pda>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, address = Pubkey::from_str("7puZAsLpXicj2vmCUB1YXnzbKcE7MLEpMroMBRaRwjGJ").unwrap())]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub pda: Account<'info, Pda>,
}

#[account]
pub struct Pda {}
