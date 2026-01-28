import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccount,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { assert } from "chai";
import { TokenSale } from "../target/types/token_sale";

describe("token_sale", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.tokenSale as Program<TokenSale>;
  const connection = provider.connection;

  const adminKp = provider.wallet.payer;
  const buyer = adminKp;
  const TOKENS_PER_SOL = 100;

  const adminConfigKp = web3.Keypair.generate();

  let mint: anchor.web3.PublicKey;
  let treasuryPda: anchor.web3.PublicKey;
  let buyerAta: anchor.web3.PublicKey;

  it("creates mint", async () => {
    [mint] = web3.PublicKey.findProgramAddressSync([Buffer.from("token_mint")], program.programId);
    [treasuryPda] = web3.PublicKey.findProgramAddressSync([Buffer.from("treasury")], program.programId);

    // admin = 当前签名者地址；adminConfig = 存「谁是 admin」的配置账户地址。两个都要传：
    // 程序用 admin 验证「谁在签名」，用 adminConfig 指向的账户读出「合法 admin」并写入。
    const tx = await program.methods.initialize().accounts({
      admin: adminKp.publicKey,
      adminConfig: adminConfigKp.publicKey,
      mint: mint,
      treasury: treasuryPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([adminKp, adminConfigKp]).rpc();

    console.log("initialize tx:", tx);

    const mintInfo = await getMint(connection, mint);
    assert.equal(mintInfo.mintAuthority.toBase58(), mint.toBase58());
    assert.equal(Number(mintInfo.supply), 0);
    assert.equal(mintInfo.decimals, 9);
  });

  it("buy tokens", async () => {
    const solToSend = new anchor.BN(1e9);
    const expectedTokenAmount = Number(solToSend) * TOKENS_PER_SOL;

    const initialTreasuryBalance = await connection.getBalance(treasuryPda);

    buyerAta = await createAssociatedTokenAccount(connection, buyer, mint, buyer.publicKey, undefined, TOKEN_PROGRAM_ID);

    const buyerAtaInfo = await getAccount(connection, buyerAta, undefined, TOKEN_PROGRAM_ID);
    const initialBuyerAtaBalance = Number(buyerAtaInfo.amount);

    const tx = await program.methods.mint(solToSend).accounts({
      buyer: buyer.publicKey,
      mint: mint,
      buyerAta: buyerAta,
      treasury: treasuryPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();
    
    console.log("mint tx:", tx);
    console.log("Sent", lamportsToSol(solToSend), "SOL, expecting", toDisplayAmount(expectedTokenAmount), "tokens");

    const newTreasuryBalance = await connection.getBalance(treasuryPda);
    assert.equal(newTreasuryBalance - initialTreasuryBalance, Number(solToSend), "SOL was not correctly transferred to the treasury");

    const updatedBuyerAtaInfo = await getAccount(connection, buyerAta, undefined, TOKEN_PROGRAM_ID);
    const newBuyerAtaBalance = Number(updatedBuyerAtaInfo.amount);
    assert.equal(newBuyerAtaBalance - initialBuyerAtaBalance, expectedTokenAmount, "Tokens were not correctly minted");
  });

  it("stops minting when supply cap is reached", async () => {
    const mintInfo = await getMint(connection, mint, undefined, TOKEN_PROGRAM_ID);
    const currentSupply = Number(mintInfo.supply);

    const SUPPLY_CAP = toRawTokenAmount(1000);
    const remainingTokens = SUPPLY_CAP - currentSupply;

    console.log(`Current supply: ${toDisplayAmount(currentSupply)} tokens,
    Remaining tokens: ${toDisplayAmount(remainingTokens)} tokens`);

    const tokensToMint = remainingTokens + toRawTokenAmount(20);
    const solToSend = new anchor.BN(Math.ceil(tokensToMint / TOKENS_PER_SOL));

    console.log(`Tring to mint ${toDisplayAmount(tokensToMint)} tokens, by sending ${lamportsToSol(solToSend)} SOL`);

    try{
      await program.methods.mint(solToSend).accounts({
        buyer: buyer.publicKey,
        mint: mint,
        buyerAta: buyerAta,
        treasury: treasuryPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).rpc();
      assert.fail("Minting should have failed due to supply cap");
    } catch (error) {
      console.log("Expected error:", error.toString().substring(0, 150) + "...");
      assert.include(error.toString(), "SupplyLimit", "Expected supply limit error not received");
      console.log("Supply cap limit correctly enforced");
    }
  });

  it("allows the admin to withdraw funds from treasury", async () => {
    const initialAdminBalance = await connection.getBalance(adminKp.publicKey);
    const initialTreasuryBalance = await connection.getBalance(treasuryPda);

    console.log("Initial admin balance:", lamportsToSol(initialAdminBalance), "SOL");
    console.log("Initial treasury balance:", lamportsToSol(initialTreasuryBalance), "SOL");

    assert.isAbove(initialTreasuryBalance, 0, "Treasury should have funds from previous tests");

    const amountToWithdraw = new anchor.BN(Math.floor(initialTreasuryBalance / 2));

    // 即使 admin_config 已链上持久化，仍必须传入其地址：程序只能使用本笔交易传入的账户，不会自己去查链。
    try{
      const tx = await program.methods.withdrawFunds(amountToWithdraw).accounts({
        admin: adminKp.publicKey,
        adminConfig: adminConfigKp.publicKey,
        treasury: treasuryPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).rpc();
      console.log("Withdrawal tx:", tx);

      const newAdminBalance = await connection.getBalance(adminKp.publicKey);
      const newTreasuryBalance = await connection.getBalance(treasuryPda);

      console.log("New treasury balance:", lamportsToSol(newTreasuryBalance), "SOL");
      console.log("New admin balance:", lamportsToSol(newAdminBalance), "SOL");

      assert.approximately(initialTreasuryBalance - newTreasuryBalance, Number(amountToWithdraw), 10000, 
      "Treasury balance did not decrease by approximately the correct amount");

      assert.isTrue(newAdminBalance > initialAdminBalance, "Admin balance did not increase after withdrawal");
    } catch (error) {
      console.log("Error in withdraw test:", error);
      throw error;
    }
  });
});

/** Lamports → SOL，用 @solana/web3.js 的 LAMPORTS_PER_SOL 自算即可，官方无现成函数 */
function lamportsToSol(lamports: anchor.BN | number): number {
  return Number(lamports) / web3.LAMPORTS_PER_SOL;
}

/** Raw token amount → 可读数量。标准 token 用 amount/10^decimals；要支持扩展可用 @solana/spl-token 的 amountToUiAmount / amountToUiAmountForMintWithoutSimulation */
function toDisplayAmount(rawAmount: number, decimals: number = 9): string {
  return (rawAmount / 10 ** decimals).toFixed(2);
}

/** 可读数量 → raw token amount（toDisplayAmount 的逆），用于和链上 supply/amount 比较 */
function toRawTokenAmount(displayAmount: number, decimals: number = 9): number {
  return Math.floor(displayAmount * 10 ** decimals);
}