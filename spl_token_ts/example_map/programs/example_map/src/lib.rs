use anchor_lang::prelude::*;

declare_id!("635ePsbTnfHA4Cuw7avePHfpskvqt1HzLixZQg1r8Dkb");

#[program]
pub mod example_map {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, key: u64) -> Result<()> {
        ctx.accounts.val.value = key;
        Ok(())
    }

    pub fn set(ctx: Context<Set>, key: u64, value: u64) -> Result<()> {
        ctx.accounts.val.value = value;
        Ok(())
    }

    pub fn init_parent(ctx: Context<InitParent>) -> Result<()> {
        let parent = &mut ctx.accounts.parent;
        parent.authority = ctx.accounts.authority.key();
        parent.bump = *ctx.bumps.get("parent").unwrap();
        parent.next_child_id = 0;
        Ok(())
    }

    pub fn init_child(ctx: Context<InitChild>) -> Result<()> {
        let parent = &mut ctx.accounts.parent;
        let child = &mut ctx.accounts.child;
        child.parent = parent.key();
        child.child_id = parent.next_child_id;
        child.bump = *ctx.bumps.get("child").unwrap();
        parent.next_child_id += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitParent<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 1 + 8 + 1, seeds=[b"parent", authority.key().as_ref()], bump)]
    pub parent: Account<'info, Parent>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitChild<'info> {
    #[account(mut, seeds = [b"parent", authority.key().as_ref()], bump = parent.bump,has_one = authority)]
    pub parent: Account<'info, Parent>,
    #[account(init, payer = authority, space = 8 + 32 + 8 + 1 + 8, seeds=[b"child", parent.key().as_ref(), parent.next_child_id.to_le_bytes().as_ref()], bump)]
    pub child: Account<'info, Child>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(key: u64)]
pub struct Initialize<'info> {
    #[account(init, payer = singer, space = size_of::<Val>()+8, seeds=[key.to_le_bytes().as_ref()], bump)]
    val: Account<'info, Val>,

    #[account(mut)]
    singer: Signer<'info>,

    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(key: u64)]
pub struct Set<'info> {
    #[account(mut)]
    val: Account<'info, Val>,
}

#[account]
pub struct Val {
    value: u64,
}

#[account]
pub struct Parent {
    pub authority: Pubkey,
    pub bump: u8,
    pub next_child_id: u64,
}

#[account]
pub struct Child {
    pub parent: Pubkey,
    pub child_id: u64,
    pub bump: u8,
}
