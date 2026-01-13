use anchor_lang::prelude::*;

declare_id!("AHNFdxptchVpMck6D55gxqEgTciPtFwnuHjj7TEmA3Rn");

#[program]
pub mod sysvars {
    use super::*;
    use anchor_lang::solana_program::sysvar::last_restart_slot::LastRestartSlot;

    pub fn initialize(_ctx: Context<Initialize>, number: u32) -> Result<()> {
        // Directly fetch the LastRestartSlot sysvar
        let last_restart_slot = LastRestartSlot::get()?;
        msg!("Last restart slot: {}", last_restart_slot.last_restart_slot);
        msg!("Number is: {}", number);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
