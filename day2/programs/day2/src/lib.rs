use anchor_lang::prelude::*;

declare_id!("HEM54hC4DMjNQjUZUMbxSXY5dksfbQ7kSjEqJA57TkMS");

#[program]
pub mod day2 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, a: u64, b:u64, message: String) -> Result<()> {
        msg!("-----Got {:?} and {:?}-----", a, b);
        msg!("-----Message: {:?}-----", message);

        Ok(())
    }

    pub fn array(ctx: Context<Initialize>, arr: Vec<u64>) -> Result<()> {
        msg!("-----Got array: {:?}-----", arr);
        Ok(())
    }

    pub fn overflow(ctx: Context<Initialize>, y: u64, z: u64) -> Result<()> {
        let x: u64 = y - z; // will silently overflow
        let xSafe: u64 = y.checked_sub(z).unwrap(); // will panic if overflow happens

        // checked_sub, checked_mul, etc are also available
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
