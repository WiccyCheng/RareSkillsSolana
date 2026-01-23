use anchor_lang::prelude::*;

declare_id!("5U6mLZ9ZipAJigzKS5xBJdfg8xnLQbkQnCJHmWfkDeoG");

#[program]
pub mod account_types {
    use super::*;

    pub fn hello(ctx: Context<Hello>) -> Result<()> {
        let lamports = ctx.accounts.signer.lamports();
        let address = &ctx.accounts.signer.signer_key().unwrap();
        msg!("hello {:?} you have {} lamports", address, lamports);
        Ok(())
    }

    // pub fn foo(ctx: Context<Foo>) -> Result<()> {
    //     let data = ctx.accounts.some_account.try_borrow_data()?;
    //     msg!("Data: {:?}", data);
    //     Ok(())
    // }
}

// #[derive(Accounts)]
// pub struct Foo<'info> {
//     // pub some_account: Account<'info, SomeAccount>,
//     /// CHECK: we are just printing the data
//     some_account: AccountInfo<'info>,
// }

// #[account]
// pub struct SomeAccount{}

#[derive(Accounts)]
pub struct Hello<'info> {
    pub signer: Signer<'info>,
}
