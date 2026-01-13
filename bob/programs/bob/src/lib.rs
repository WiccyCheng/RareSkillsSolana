use anchor_lang::prelude::*;

declare_id!("3jYj2YR6oTaKSduoiAvs6CeV6Y8QFuyvdxDXBYHeKgRB");

#[program]
pub mod bob {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!(
            "Data Account Initialized: {}",
            ctx.accounts.bob_data_account.key()
        );
        Ok(())
    }

    pub fn bob_add_op(ctx: Context<BobAddOp>, a: u64, b: u64) -> Result<()> {
        let result = a + b;
        ctx.accounts.bob_data_account.result = result;
        Ok(())
    }
}

#[account]
pub struct BobData {
    pub result: u64,
}

#[derive(Accounts)]
pub struct BobAddOp<'info> {
    #[account(mut)]
    pub bob_data_account: Account<'info, BobData>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<BobData>()+8)]
    pub bob_data_account: Account<'info, BobData>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
