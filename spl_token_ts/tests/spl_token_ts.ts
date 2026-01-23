import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { assert } from 'chai';

describe("TypeScript SPL Token Tests", () => {
  const provider = anchor.AnchorProvider.env();
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
});
