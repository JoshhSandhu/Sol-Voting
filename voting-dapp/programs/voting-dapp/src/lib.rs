use anchor_lang::prelude::*;

declare_id!("F1sVUCiy8AMdmcQYgo4QueoZPayWvkYHEqyCK7cP66tZ");

#[program]
pub mod voting_dapp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
