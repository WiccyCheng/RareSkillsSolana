use anchor_lang::prelude::*;

declare_id!("DyxExS9dBuiVGxntTMBJCprGCwfSdmSa9bGKDvizh126");

#[program]
pub mod keypair_vs_pda {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<MyKeypairAccount>() + 8)]
    pub my_keypair_account: Account<'info, MyKeypairAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyKeypairAccount {
    pub data: u64,
}
