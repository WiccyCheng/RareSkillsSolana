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
});

/** Lamports → SOL，用 @solana/web3.js 的 LAMPORTS_PER_SOL 自算即可，官方无现成函数 */
function lamportsToSol(lamports: anchor.BN | number): number {
  return Number(lamports) / web3.LAMPORTS_PER_SOL;
}

/** Raw token amount → 可读数量。标准 token 用 amount/10^decimals；要支持扩展可用 @solana/spl-token 的 amountToUiAmount / amountToUiAmountForMintWithoutSimulation */
function toDisplayAmount(rawAmount: number, decimals: number = 9): string {
  return (rawAmount / 10 ** decimals).toFixed(2);
}