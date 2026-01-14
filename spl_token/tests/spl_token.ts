import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import type { SplToken } from "../target/types/spl_token";

describe("spl_token", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.splToken as Program<SplToken>;

  const provider = anchor.AnchorProvider.env();
  const signerKp = provider.wallet.payer;
  const toKp = new web3.Keypair();

  it("Creates a new mint and associated token account using CPI", async () => {
    const [mint] = PublicKey.findProgramAddressSync([Buffer.from("my_mint"), signerKp.publicKey.toBuffer()], program.programId);
    const ata = splToken.getAssociatedTokenAddressSync(mint, signerKp.publicKey, false);

    const tx = await program.methods.createAndMintAccount().accounts({
      signer: signerKp.publicKey,
      newMint: mint,
      newAta: ata,
      tokenProgram: splToken.TOKEN_PROGRAM_ID,
      associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    console.log("Transaction signature:", tx);
    console.log("Token (Mint Account) Address:", mint.toString());
    console.log("Associated Token Account:", ata.toString());

    const mintInfo = await splToken.getMint(provider.connection, mint);
    assert.equal(mintInfo.decimals, 9, "Mint decimals should be 9");
    assert.equal(mintInfo.mintAuthority?.toString(), signerKp.publicKey.toString(), "Mint authority should be the signer");
    assert.equal(mintInfo.freezeAuthority?.toString(), signerKp.publicKey.toString(), "Freeze authority should be the signer");
    assert.equal(mintInfo.supply.toString(), "100000000000", "Supply should be 100 tokens (with 9 decimals)");

    const tokenAccount = await splToken.getAccount(provider.connection, ata);
    assert.equal(tokenAccount.mint.toString(), mint.toString(), "Token account mint should match the mint PDA");
    assert.equal(tokenAccount.owner.toString(), signerKp.publicKey.toString(), "Token account owner should be the signer");
    assert.equal(tokenAccount.amount.toString(), "100000000000", "Token balance should be 100 tokens (with 9 decimals)");
    assert.equal(tokenAccount.delegate, null, "Token account should not have a delegate");
  });
});
