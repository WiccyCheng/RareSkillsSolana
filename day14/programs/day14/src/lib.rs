use anchor_lang::prelude::*;

declare_id!("6rWHXvDvDWvYBddMXeHRrD81dzCfwQmLF3fLvAFDbCc8");

const OWNER: Pubkey= pubkey!("7puZAsLpXicj2vmCUB1YXnzbKcE7MLEpMroMBRaRwjGJ");

#[program]
pub mod day14 {
    use super::*;

    pub fn initialize(ctx: Context<OnlyOwner>) -> Result<()> {

        check(&ctx)?;
        msg!("Hi");
        Ok(())
    }
}

fn check(ctx: &Context<OnlyOwner>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.signer_account.key(),
        OWNER,
        OnlyOwnerError::NotOwner
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct OnlyOwner<'info> {
    pub signer_account: Signer<'info>,
}

#[error_code]
pub enum OnlyOwnerError {
    #[msg("Only owner can call this function!")]
    NotOwner,
}