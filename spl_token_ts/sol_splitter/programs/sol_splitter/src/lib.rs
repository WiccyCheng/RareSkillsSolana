use anchor_lang::prelude::*;

declare_id!("2f9Lu9pVPai5aGnanYex1Cc3KvbCprTxkUamYjYVGBU4");

#[program]
pub mod sol_splitter {
    use anchor_lang::system_program;

    use super::*;

    pub fn split_sol<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, SplitSol<'info>>,
        amount: u64,
    ) -> Result<()> {
        let amount_each_gets = amount / ctx.remaining_accounts.len() as u64;
        let system_program = &ctx.accounts.system_program;

        for recipient in ctx.remaining_accounts {
            let cpi_accounts = system_program::Transfer {
                from: ctx.accounts.signer.to_account_info(),
                to: recipient.to_account_info(),
            };

            let cpi_program = system_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            let res = system_program::transfer(cpi_context, amount_each_gets);

            if !res.is_ok() {
                return err!(ErrorCode::TransferFailed);
            }
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SplitSol<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("transfer failed")]
    TransferFailed,
}
