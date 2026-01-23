╔═══════════════════════════════════════════════════════════════════════════════╗
║                        SPL TOKEN 代币系统架构                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   👤 Signer (你的钱包 - Mint Authority)                                       ║
║   ┌─────────────────────────────────┐                                         ║
║   │ 地址: 7puZAsLpXicj2vmCUB1Y...    │                                        ║
║   │ 角色: 拥有铸造权限 / 可以禁用权限  │                                        ║
║   └─────────────────┬───────────────┘                                         ║
║                     │                                                         ║
║                     │ 1️⃣ 调用 disable_mint_authority()                       ║
║                     ▼                                                         ║
║   ┌─────────────────────────────────────────────────────────────────────┐     ║
║   │ 📦 你的程序 (spl_token_ts)                                          │     ║
║   │ ═══════════════════════════════════════════════════════════════════ │     ║
║   │ Program ID: 7eGZP7XyhPLDWWArSMVbY7J1JX52B6GC5qmYrggyimEa            │     ║
║   │                                                                     │     ║
║   │ 指令: disable_mint_authority()                                    │     ║
║   │   ┌─────────────────────────────────────────────────────────┐     │     ║
║   │   │ pub fn disable_mint_authority(ctx: Context<...>) {      │     │     ║
║   │   │   let cpi_ctx = CpiContext::new(                        │     │     ║
║   │   │     ctx.accounts.token_program,  ← 指向TOKEN_PROGRAM_ID │     │     ║
║   │   │     cpi_accounts                                         │     │     ║
║   │   │   );                                                     │     │     ║
║   │   │   token::set_authority(                                  │     │     ║
║   │   │     cpi_ctx,                                             │     │     ║
║   │   │     AuthorityType::MintTokens,                           │     │     ║
║   │   │     None  ← 设置为None，禁用权限                          │     │     ║
║   │   │   )?;                                                    │     │     ║
║   │   │ }                                                        │     │     ║
║   │   └─────────────────────────────────────────────────────────┘     │     ║
║   └─────────────────────────────────┬───────────────────────────────────┘     ║
║                                     │                                         ║
║                                     │ 2️⃣ CPI调用 (跨程序调用)                 ║
║                                     │   传入: tokenProgram (程序ID)           ║
║                                     ▼                                         ║
║   ┌─────────────────────────────────────────────────────────────────────┐     ║
║   │ 🔧 TOKEN_PROGRAM_ID (SPL Token 程序)                                │     ║
║   │ ═══════════════════════════════════════════════════════════════════ │     ║
║   │ Program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA             │     ║
║   │ (这是程序，不是账户！包含可执行代码)                                 │     ║
║   │                                                                     │     ║
║   │ 功能:                                                               │     ║
║   │   • createMint()       创建代币工厂                                │     ║
║   │   • mintTo()           铸造代币                                    │     ║
║   │   • transfer()         转账代币                                    │     ║
║   │   • set_authority()    设置权限 ← 我们调用这个                      │     ║
║   │   • freezeAccount()    冻结账户                                    │     ║
║   └─────────────────────────────────┬───────────────────────────────────┘     ║
║                                     │                                         ║
║                                     │ 3️⃣ 修改 mint 账户数据                   ║
║                                     ▼                                         ║
║   ┌─────────────────────────────────────────────────────────────────────┐     ║
║   │ 🏭 Mint Account (代币工厂账户)                                       │     ║
║   │ ═══════════════════════════════════════════════════════════════════ │     ║
║   │ 地址: 由 createMint() 生成 (例如: 8xK...abc)                        │     ║
║   │ Owner: TOKEN_PROGRAM_ID                                             │     ║
║   │                                                                     │     ║
║   │ 存储的数据:                                                         │     ║
║   │   ┌─────────────────────────────────────────────────────────┐     │     ║
║   │   │ decimals: 6                    (小数位数)               │     │     ║
║   │   │ supply: 1000000                (总供应量)                │     │     ║
║   │   │ mint_authority: 7puZAs...      (铸造权限) ← 会被设为None │     │     ║
║   │   │ freeze_authority: 7puZAs...    (冻结权限)                │     │     ║
║   │   └─────────────────────────────────────────────────────────┘     │     ║
║   │                                                                     │     ║
║   │ ⚠️ 重要: Mint账户在 createMint() 时就存在了！                     │     ║
║   │   不需要铸造代币，mint账户就已经存在（supply可以是0）              │     ║
║   └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────┐     ║
║   │ 💰 ATA Account (Associated Token Account)                           │     ║
║   │ ═══════════════════════════════════════════════════════════════════ │     ║
║   │ 地址: 由 getAssociatedTokenAddressSync() 计算                       │     ║
║   │   公式: PDA(owner, TOKEN_PROGRAM_ID, mint)                          │     ║
║   │ Owner: TOKEN_PROGRAM_ID                                             │     ║
║   │                                                                     │     ║
║   │ 存储的数据:                                                         │     ║
║   │   ┌─────────────────────────────────────────────────────────┐     │     ║
║   │   │ mint: 8xK...abc           (指向哪个mint)                  │     │     ║
║   │   │ owner: 7puZAs...          (代币拥有者)                    │     │     ║
║   │   │ amount: 1000000          (代币余额)                      │     │     ║
║   │   │ state: Initialized        (账户状态)                      │     │     ║
║   │   └─────────────────────────────────────────────────────────┘     │     ║
║   │                                                                     │     ║
║   │ 关系: 一个用户可以有多个ATA（每个mint一个）                          │     ║
║   │       一个mint可以有多个ATA（每个用户一个）                          │     ║
║   └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ 📝 关键概念速记:                                                               ║
║                                                                               ║
║   • TOKEN_PROGRAM_ID = SPL Token程序地址 (程序，不是账户)                     ║
║   • Mint Account = 代币工厂 (在createMint时就存在，supply可以是0)              ║
║   • ATA Account = 用户的代币钱包 (由owner+mint计算得出，PDA)                   ║
║   • CPI = 跨程序调用 (你的程序调用TOKEN_PROGRAM_ID)                            ║
║   • Mint Authority = 铸造权限 (设为None后无法再铸造，supply固定)               ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ 🔧 代码对应 (TypeScript):                                                     ║
║                                                                               ║
║   // 1. 创建mint账户                                                          ║
║   const mintPublicKey = await splToken.createMint(                            ║
║     connection, signer, mintAuthority, freezeAuthority, decimals             ║
║   );                                                                          ║
║                                                                               ║
║   // 2. 创建ATA账户                                                           ║
║   const ataAddress = await splToken.createAssociatedTokenAccount(            ║
║     connection, signer, mintPublicKey, ownerPublicKey                        ║
║   );                                                                          ║
║                                                                               ║
║   // 3. 铸造代币                                                              ║
║   await splToken.mintTo(                                                     ║
║     connection, signer, mintPublicKey, ataAddress,                           ║
║     mintAuthority, amount                                                    ║
║   );                                                                          ║
║                                                                               ║
║   // 4. 调用你的程序禁用mint authority                                        ║
║   await program.methods.disableMintAuthority().accounts({                    ║
║     mint: mintPublicKey,              // Mint账户地址                        ║
║     authority: signer.publicKey,       // 签名者（mint authority）             ║
║     tokenProgram: TOKEN_PROGRAM_ID,   // SPL Token程序ID                     ║
║     systemProgram: SystemProgram.programId                                   ║
║   }).rpc();                                                                   ║
║                                                                               ║
║   // 5. 查询mint信息                                                          ║
║   const mintInfo = await splToken.getMint(connection, mintPublicKey);         ║
║   console.log(mintInfo.mintAuthority); // null (已被禁用)                     ║
║                                                                               ║
║   // 6. 尝试再次铸造 → 失败！"supply is fixed"                                ║
║   await splToken.mintTo(...); // ❌ 会抛出错误                                ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ 🔧 代码对应 (Rust):                                                           ║
║                                                                               ║
║   #[derive(Accounts)]                                                        ║
║   pub struct DisableMintAuthority<'info> {                                   ║
║       #[account(mut)]                                                        ║
║       pub mint: Account<'info, Mint>,        // Mint账户                      ║
║       pub authority: Signer<'info>,          // 签名者                        ║
║       pub token_program: Program<'info, Token>, // TOKEN_PROGRAM_ID          ║
║       pub system_program: Program<'info, System>,                            ║
║   }                                                                           ║
║                                                                               ║
║   pub fn disable_mint_authority(ctx: Context<DisableMintAuthority>) {       ║
║       let cpi_accounts = token::SetAuthority {                               ║
║           account_or_mint: ctx.accounts.mint.to_account_info(),               ║
║           current_authority: ctx.accounts.authority.to_account_info(),       ║
║       };                                                                      ║
║       let cpi_ctx = CpiContext::new(                                         ║
║           ctx.accounts.token_program.to_account_info(),                      ║
║           cpi_accounts                                                       ║
║       );                                                                      ║
║       token::set_authority(                                                  ║
║           cpi_ctx,                                                            ║
║           spl_token::instruction::AuthorityType::MintTokens,                 ║
║           None  // 设置为None，禁用权限                                       ║
║       )?;                                                                     ║
║   }                                                                           ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ 🔄 数据流:                                                                     ║
║                                                                               ║
║   1. Signer 调用你的程序 → disable_mint_authority()                           ║
║   2. 你的程序通过CPI调用 → TOKEN_PROGRAM_ID.set_authority()                   ║
║   3. TOKEN_PROGRAM_ID 修改 → Mint账户的mint_authority字段设为None            ║
║   4. 结果: 无法再铸造代币，supply固定                                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
