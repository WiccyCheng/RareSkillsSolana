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
});
