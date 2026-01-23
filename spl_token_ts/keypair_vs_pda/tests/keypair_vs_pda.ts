import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { KeypairVsPda } from "../target/types/keypair_vs_pda";

async function airdropSol(publicKey, amount) {
  let tx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount * anchor.web3.LAMPORTS_PER_SOL);
  await confirmTransaction(tx);
}

async function confirmTransaction(tx) {
  const latestBlockHash = await anchor.getProvider().connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: tx,
  });
}

describe("keypair_vs_pda", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.keypairVsPda as Program<KeypairVsPda>;

  it("Writing to keypair account fails!", async () => {
    const newKeypair = anchor.web3.Keypair.generate();
    var receiverWallet = anchor.web3.Keypair.generate();

    await airdropSol(newKeypair.publicKey, 10);

    var transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: newKeypair.publicKey,
        toPubkey: receiverWallet.publicKey,
        lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
      }),
    );

    await anchor.web3.sendAndConfirmTransaction(
      anchor.getProvider().connection,
      transaction,
      [newKeypair],
    );

    console.log("sent 1 SOL from", newKeypair.publicKey.toBase58(), "to", receiverWallet.publicKey.toBase58());

    await program.methods.initialize().accounts({ myKeypairAccount: newKeypair.publicKey }).signers([newKeypair]).rpc();
    console.log("initialized!");

    var transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: newKeypair.publicKey,
        toPubkey: receiverWallet.publicKey,
        lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
      }),
    );
  });

  it("pda should failed!", async () => {
    const newKeypair = anchor.web3.Keypair.generate();
    const seeds = [];
    const [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
      seeds,
      program.programId
    );
    await airdropSol(newKeypair.publicKey, 2);

    console.log("New Keypair Public Key:", newKeypair.publicKey.toBase58());

    const tx = await program.methods.initialize().accounts({ myKeypairAccount: pda }).signers([newKeypair]).rpc();
  });
});
