use anchor_lang::prelude::*;

declare_id!("HVW2rZJzmMoByFYEWmAYQzpNMJaimd21PAwF6Ld3AaR7");

#[program]
pub mod other_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn setbool(ctx: Context<SetFlag>, flag: bool) -> Result<()> {
        ctx.accounts.true_or_false.flag = flag;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    signer: Signer<'info>,

    system_program: Program<'info, System>,

    #[account(init, payer = signer, space = size_of::<TrueOrFalse>() + 8, seeds=[], bump)]
    true_or_false: Account<'info, TrueOrFalse>,
}

#[derive(Accounts)]
pub struct SetFlag<'info> {
    #[account(mut)]
    true_or_false: Account<'info, TrueOrFalse>,
}

#[account]
pub struct TrueOrFalse {
    flag: bool,
}
