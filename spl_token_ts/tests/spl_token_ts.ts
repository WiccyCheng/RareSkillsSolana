import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { assert } from 'chai';
import { SplTokenTs } from "../target/types/spl_token_ts";

anchor.setProvider(anchor.AnchorProvider.env());

describe("TypeScript SPL Token Tests", () => {
  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.SplTokenTs as anchor.Program<SplTokenTs>;
  const signerKp = provider.wallet.payer;
  const toKp = new web3.Keypair();

  const mintDecimals = 6;
  const mintAuthority = provider.wallet.publicKey;
  const freezeAuthority = provider.wallet.publicKey;

  it("Create a mint account and ATA using TypeScript", async () => {
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals,
    );

    console.log("Created Mint:", mintPublicKey.toString());

    const ataAddress = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey,
    );

    console.log("Created ATA:", ataAddress.toString());

    const mintAmount = BigInt(1000 * 10 ** mintDecimals);
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      ataAddress,
      mintAuthority,
      mintAmount,
    );

    const mintInfo = await splToken.getMint(
      provider.connection,
      mintPublicKey,
    );

    assert.equal(mintInfo.decimals, mintDecimals, "Mint decimals should match");
    assert.equal(mintInfo.mintAuthority?.toString(), mintAuthority.toString(), "Mint authority should match");
    assert.equal(mintInfo.freezeAuthority?.toString(), freezeAuthority.toString(), "Freeze authority should match");

    const accountInfo = await splToken.getAccount(
      provider.connection,
      ataAddress,
    );

    assert.equal(accountInfo.amount.toString(), mintAmount.toString(), "Balance should match minted amount");
  });

  it("Reads token balance using TypeScript", async () => {
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals,
    );

    const ataAddress = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey,
    );
    
    const mintAmount = BigInt(1000 * 10 ** mintDecimals);
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      ataAddress,
      mintAuthority,
      mintAmount,
    );

    // 方式1: 使用 SPL Token 库的 getAccount 方法获取账户信息（包含余额）
    const accountInfo = await splToken.getAccount(
      provider.connection,
      ataAddress,
    );
    console.log("Token Balance:", accountInfo.amount.toString());
    assert.equal(accountInfo.amount.toString(), mintAmount.toString(), "Balance should match minted amount");

    // 方式2: 使用 Web3.js 原生的 getTokenAccountBalance 方法直接查询余额
    // provider.connection 是 Solana 的 Connection 对象，用于与区块链网络（localnet/devnet/mainnet）进行 RPC 通信
    // 即使配置为 localnet，账户数据仍然存储在链上，需要通过 RPC 调用查询
    const balance = await provider.connection.getTokenAccountBalance(ataAddress);
    assert.equal(balance.value.amount.toString(), mintAmount.toString(), "Balance should match minted amount");
  });

  it("Transfers tokens using TypeScript", async () => {
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals,
    );

    const sourceAta = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey,
    );

    const destinationAta = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      toKp.publicKey,
    );

    const mintAmount = BigInt(1000 * 10 ** mintDecimals);
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      sourceAta,
      mintAuthority,
      mintAmount,
    );

    const sourceBalanceBefore = await provider.connection.getTokenAccountBalance(sourceAta);
    const destinationBalanceBefore = await provider.connection.getTokenAccountBalance(destinationAta);

    console.log("Source Balance Before Transfer:", sourceBalanceBefore.value.amount.toString());
    console.log("Destination Balance Before Transfer:", destinationBalanceBefore.value.amount.toString());

    const transferAmount = BigInt(500 * 10 ** mintDecimals);
    await splToken.transfer(
      provider.connection,
      signerKp,
      sourceAta,
      destinationAta,
      signerKp.publicKey,
      transferAmount,
    );

    const sourceBalanceAfter = await provider.connection.getTokenAccountBalance(sourceAta);
    const destinationBalanceAfter = await provider.connection.getTokenAccountBalance(destinationAta);
    console.log("Source Balance after transfer:", sourceBalanceAfter.value.amount);
    console.log("Destination Balance after transfer:", destinationBalanceAfter.value.amount);
    assert.equal(sourceBalanceAfter.value.amount, (mintAmount - transferAmount).toString(), "Source should have 500 tokens left");
    assert.equal(destinationBalanceAfter.value.amount, transferAmount.toString(), "Destination should have received 500 tokens");
  });

  it("Demonstrates: What is tokenProgram?", async () => {
    // 问题2的演示：tokenProgram是什么？
    console.log("\n=== tokenProgram 解释 ===");
    console.log("TOKEN_PROGRAM_ID:", TOKEN_PROGRAM_ID.toString());
    console.log("TOKEN_PROGRAM_ID 是一个程序地址（Program ID），不是账户！");
    console.log("它是 Solana 上的 SPL Token 程序，负责处理所有token操作：");
    console.log("  - 创建mint账户");
    console.log("  - 铸造代币");
    console.log("  - 转账代币");
    console.log("  - 设置权限（set_authority）");
    console.log("  - 等等...");
    console.log("\n类比：");
    console.log("  - SystemProgram: Solana系统程序（处理账户创建等）");
    console.log("  - TOKEN_PROGRAM_ID: SPL Token程序（处理所有token操作）");
    console.log("  - 你的程序: spl_token_ts（你自己的程序）");
    console.log("\n在CPI（跨程序调用）中，我们需要告诉Solana：");
    console.log("  '请调用TOKEN_PROGRAM_ID这个程序来执行set_authority操作'");
    console.log("  所以需要传入tokenProgram作为目标程序\n");

    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals,
    );

    // 演示：调用我们的程序，我们的程序会调用TOKEN_PROGRAM_ID
    const tx = await program.methods.disableMintAuthority().accounts({
      mint: mintPublicKey,              // 这是mint账户（数据账户）
      authority: signerKp.publicKey,    // 这是签名者账户
      tokenProgram: TOKEN_PROGRAM_ID,   // 这是程序ID（不是账户！），告诉Anchor要调用哪个程序
      systemProgram: web3.SystemProgram.programId, // 这也是程序ID
    }).rpc();

    console.log("交易成功！我们的程序调用了TOKEN_PROGRAM_ID来执行set_authority");
  });

  it("Demonstrates: Mint account exists without minting tokens", async () => {
    // 问题1的演示：Mint账户在创建时就存在，不需要铸造代币
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals,
    );

    // 此时mint账户已经存在，我们可以查询它
    const mintInfo = await splToken.getMint(
      provider.connection,
      mintPublicKey,
    );

    console.log("Mint账户已创建，无需铸造代币即可存在");
    console.log("Mint地址:", mintPublicKey.toString());
    console.log("Mint Authority:", mintInfo.mintAuthority?.toString());
    console.log("Decimals:", mintInfo.decimals);
    console.log("Supply:", mintInfo.supply.toString()); // 此时supply是0，但mint账户已存在

    assert.isNotNull(mintInfo, "Mint账户在创建时就存在");
    assert.equal(mintInfo.supply.toString(), "0", "初始supply为0，但mint账户已存在");
    
    // 现在可以禁用mint authority，即使还没有铸造任何代币
    const disableTx = await program.methods.disableMintAuthority().accounts({
      mint: mintPublicKey,
      authority: signerKp.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    }).rpc();

    const mintInfoAfter = await splToken.getMint(
      provider.connection,
      mintPublicKey,
    );
    assert.isNull(mintInfoAfter.mintAuthority, "Mint authority已被禁用，即使从未铸造过代币");
  });

  it("Disables mint authority", async () => {
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals,
    );

    const ataAddress = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey,
    );

    // 先铸造一些代币
    const initialMintAmount = BigInt(1000 * 10 ** mintDecimals);
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      ataAddress,
      mintAuthority,
      initialMintAmount,
    );

    const mintInfo = await splToken.getMint(
      provider.connection,
      mintPublicKey,
    );
    console.log("Initial Mint Authority:", mintInfo.mintAuthority?.toString());
    assert.isNotNull(mintInfo.mintAuthority, "Mint authority should exist before disabling");

    // 调用 disable_mint_authority 函数
    const disableMintAuthorityTx = await program.methods.disableMintAuthority().accounts({
      mint: mintPublicKey,
      authority: signerKp.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    }).rpc();
    console.log("Disable Mint Authority Transaction:", disableMintAuthorityTx);

    // 检查 mint authority 现在是 null
    const mintInfoAfter = await splToken.getMint(
      provider.connection,
      mintPublicKey,
    );
    console.log("Mint Authority After:", mintInfoAfter.mintAuthority?.toString());
    assert.isNull(mintInfoAfter.mintAuthority, "Mint authority should be null after disabling");

    // 尝试铸造更多代币，应该失败
    const additionalMintAmount = BigInt(500 * 10 ** mintDecimals);
    try {
      await splToken.mintTo(
        provider.connection,
        signerKp,
        mintPublicKey,
        ataAddress,
        mintAuthority,
        additionalMintAmount,
      );
      assert.fail("Minting should have failed with 'supply is fixed' error");
    } catch (error: any) {
      console.log("Expected error when trying to mint:", error.message);
      assert.include(
        error.message.toLowerCase(),
        "supply is fixed",
        "Error should mention 'supply is fixed'"
      );
    }
  });
});
