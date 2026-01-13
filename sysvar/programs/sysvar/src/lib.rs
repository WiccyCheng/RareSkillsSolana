use anchor_lang::prelude::*;

declare_id!("GSJavm5obrSZCzLVVJGSXQFDqYvVaosXNWoAzkdn9rwn");

#[program]
pub mod sysvar {
    use super::*;
    use chrono::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let clock: Clock = Clock::get()?;
        msg!(
            "Block timestamp: {}",
            // Get block.timestamp
            clock.unix_timestamp,
        );
        Ok(())
    }

    pub fn get_day_of_the_week(_ctx: Context<Initialize>) -> Result<()> {
        let clock = Clock::get()?;
        let time_stamp = clock.unix_timestamp; // current timestamp

        let date_time = chrono::NaiveDateTime::from_timestamp_opt(time_stamp, 0).unwrap();
        let day_of_the_week = date_time.weekday();

        msg!("Week day is: {}", day_of_the_week);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
