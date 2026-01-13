use anchor_lang::prelude::*;

declare_id!("4JQYfN4bFZvCbdE7Gn83AAEhXx6QgRAXdb4VLTNiSX2f");

#[program]
pub mod get_account_balance {
    use super::*;

    pub fn initialize(ctx: Context<ReadBalance>) -> Result<()> {
        let balance = ctx.accounts.acct.to_account_info().lamports();
        msg!("Account balance: {} lamports", balance);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadBalance<'info> {
    /// CHECK: failed if this comment is removed
    pub acct: UncheckedAccount<'info>,
}
