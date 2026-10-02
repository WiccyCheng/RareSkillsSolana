import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import BN from "bn.js";
import type { SplToken } from "../target/types/spl_token";

describe("spl_token", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.splToken as Program<SplToken>;

  const provider = anchor.AnchorProvider.env();
  const signerKp = provider.wallet.payer;
  const toKp = new web3.Keypair();
  const mintAuthority = provider.wallet.publicKey;
  const freezeAuthority = provider.wallet.publicKey;
  const mintDecimals = 6;

  it("Creates a new mint and associated token account using CPI", async () => {
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("my_mint"), signerKp.publicKey.toBuffer()],
      program.programId
    );
    const ata = splToken.getAssociatedTokenAddressSync(
      mint,
      signerKp.publicKey,
      false
    );

    const tx = await program.methods
      .createAndMintAccount()
      .accountsStrict({
        signer: signerKp.publicKey,
        newMint: mint,
        newAta: ata,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature:", tx);
    console.log("Token (Mint Account) Address:", mint.toString());
    console.log("Associated Token Account:", ata.toString());

    const mintInfo = await splToken.getMint(provider.connection, mint);
    assert.equal(mintInfo.decimals, 9, "Mint decimals should be 9");
    assert.equal(
      mintInfo.mintAuthority?.toString(),
      signerKp.publicKey.toString(),
      "Mint authority should be the signer"
    );
    assert.equal(
      mintInfo.freezeAuthority?.toString(),
      signerKp.publicKey.toString(),
      "Freeze authority should be the signer"
    );
    assert.equal(
      mintInfo.supply.toString(),
      "100000000000",
      "Supply should be 100 tokens (with 9 decimals)"
    );

    const tokenAccount = await splToken.getAccount(provider.connection, ata);
    assert.equal(
      tokenAccount.mint.toString(),
      mint.toString(),
      "Token account mint should match the mint PDA"
    );
    assert.equal(
      tokenAccount.owner.toString(),
      signerKp.publicKey.toString(),
      "Token account owner should be the signer"
    );
    assert.equal(
      tokenAccount.amount.toString(),
      "100000000000",
      "Token balance should be 100 tokens (with 9 decimals)"
    );
    assert.equal(
      tokenAccount.delegate,
      null,
      "Token account should not have a delegate"
    );
  });

  it("Transfers token using CPI", async () => {
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("my_mint"), signerKp.publicKey.toBuffer()],
      program.programId
    );
    const fromAta = splToken.getAssociatedTokenAddressSync(
      mint,
      signerKp.publicKey,
      false
    );
    const toAta = splToken.getAssociatedTokenAddressSync(
      mint,
      toKp.publicKey,
      false
    );

    try {
      await splToken.getOrCreateAssociatedTokenAccount(
        provider.connection,
        signerKp,
        mint,
        toKp.publicKey
      );
    } catch (error) {
      throw new Error(error);
    }

    const transferAmount = new BN("10000000000");

    const tx = await program.methods
      .transferTokens(transferAmount)
      .accountsStrict({
        from: signerKp.publicKey,
        fromAta: fromAta,
        toAta: toAta,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transfer Transaction signature:", tx);

    const toBalance = await provider.connection.getTokenAccountBalance(toAta);
    assert.equal(
      toBalance.value.amount,
      transferAmount.toString(),
      "Recipient balance should match transfer amount"
    );
  });

  it("Reads token balance using CPI", async () => {
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("my_mint"), signerKp.publicKey.toBuffer()],
      program.programId
    );

    const ata = splToken.getAssociatedTokenAddressSync(
      mint,
      signerKp.publicKey
    );

    const tx = await program.methods
      .getBalance()
      .accountsStrict({ tokenAccount: ata })
      .rpc();

    console.log("Get Balance Transaction signature", tx);

    const balance = await provider.connection.getTokenAccountBalance(ata);
    assert.isTrue(
      balance.value.uiAmount > 0,
      "Token balance should be greater than 0"
    );
  });

  it("Disable mint authority", async () => {
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("my_mint"), signerKp.publicKey.toBuffer()],
      program.programId
    );
    const tx = await program.methods
      .disableMintAuthority()
      .accountsStrict({
        mint: mint,
        signer: signerKp.publicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Disable authority Transaction signature:", tx);

    const mintInfo = await splToken.getMint(provider.connection, mint);
    assert.isNull(mintInfo.mintAuthority);

    const destinationAta = splToken.getAssociatedTokenAddressSync(
      mint,
      toKp.publicKey
    );
    const mintAmount = BigInt(1000) * BigInt(10 ** mintInfo.decimals);

    let mintError: unknown;

    try {
      await splToken.mintTo(
        provider.connection,
        signerKp,
        mint,
        destinationAta,
        signerKp, // 原来的 mint authority
        mintAmount
      );
    } catch (error) {
      mintError = error;
    }

    assert.instanceOf(mintError, web3.SendTransactionError);

    const logs = (mintError as web3.SendTransactionError).logs ?? [];
    assert.include(
      logs.join("\n"),
      "Error: the total supply of this token is fixed"
    );
  });

  it("Creates a mint account and ATA using TypeScript", async () => {
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals
    );
    console.log("Created Mint:", mintPublicKey.toString());

    const ataAddress = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey
    );
    console.log("Created ATA:", ataAddress.toString());

    const mintAmount = BigInt(1000) * BigInt(10 ** mintDecimals);
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      ataAddress,
      mintAuthority,
      mintAmount
    );

    const mintInfo = await splToken.getMint(provider.connection, mintPublicKey);
    assert.equal(mintInfo.decimals, mintDecimals, "Mint decimals should match");
    assert.equal(
      mintInfo.mintAuthority?.toString(),
      mintAuthority.toString(),
      "Mint authority should match"
    );
    assert.equal(
      mintInfo.freezeAuthority?.toString(),
      freezeAuthority.toString(),
      "Freeze authority should match"
    );

    const accountInfo = await splToken.getAccount(
      provider.connection,
      ataAddress
    );
    assert.equal(
      accountInfo.amount.toString(),
      mintAmount.toString(),
      "Balance should match minted amount"
    );
  });

  it("Reads token balance using TypeScript", async () => {
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals
    );
    const ataAddress = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey
    );
    const mintAmount = BigInt(1000) * BigInt(10 ** mintDecimals);
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      ataAddress,
      mintAuthority,
      mintAmount
    );

    const accountInfo = await splToken.getAccount(
      provider.connection,
      ataAddress
    );
    console.log("Token Balance:", accountInfo.amount.toString());
    assert.equal(
      accountInfo.amount.toString(),
      mintAmount.toString(),
      "Balance should match minted amount"
    );

    const balance = await provider.connection.getTokenAccountBalance(
      ataAddress
    );
    assert.equal(
      balance.value.amount,
      mintAmount.toString(),
      "Balance should match minted amount"
    );
  });

  it("Transfer tokens using TypeScript", async () => {
    const mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals
    );
    const sourceAta = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey
    );
    const destinationAta = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      toKp.publicKey
    );

    const mintAmount = BigInt(1000) * BigInt(10 ** mintDecimals);
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      sourceAta,
      mintAuthority,
      mintAmount
    );

    const sourceBalanceBefore =
      await provider.connection.getTokenAccountBalance(sourceAta);
    const destinationBalanceBefore =
      await provider.connection.getTokenAccountBalance(destinationAta);
    console.log(
      "Source Balance before transfer:",
      sourceBalanceBefore.value.amount
    );
    console.log(
      "Destination Balance before transfer:",
      destinationBalanceBefore.value.amount
    );

    const transferAmount = BigInt(500) * BigInt(10 ** mintDecimals);
    await splToken.transfer(
      provider.connection,
      signerKp,
      sourceAta,
      destinationAta,
      signerKp.publicKey,
      transferAmount
    );

    const sourceBalanceAfter = await provider.connection.getTokenAccountBalance(
      sourceAta
    );
    const destinationBalanceAfter =
      await provider.connection.getTokenAccountBalance(destinationAta);
    console.log(
      "Source Balance after transfer:",
      sourceBalanceAfter.value.amount
    );
    console.log(
      "Destination Balance after transfer:",
      destinationBalanceAfter.value.amount
    );
    assert.equal(
      sourceBalanceAfter.value.amount,
      (mintAmount - transferAmount).toString(),
      "Source should have 500 tokens left"
    );
    assert.equal(
      destinationBalanceAfter.value.amount,
      transferAmount.toString(),
      "Destination should have received 500 tokens"
    );
  });

});
