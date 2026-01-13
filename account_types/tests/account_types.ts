import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountTypes } from "../target/types/account_types";

describe("account_types", () => {
  async function airdropSol(publicKey, amount) {
    let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdropTx);
  }

  async function confirmTransaction(tx) {
    const latestBlockhash = await anchor.getProvider().connection.getLatestBlockhash();
    await anchor.getProvider().connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: tx,
    });
  }
  
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.accountTypes as Program<AccountTypes>;

  it("Hello", async () => {
    await program.methods.hello().rpc();
  });

  // it("Wrong owner with Account", async () => {
  //   const newKeypair = anchor.web3.Keypair.generate();
  //   await airdropSol(newKeypair.publicKey, 10);

  //   await program.methods.foo().accounts({someAccount: newKeypair.publicKey}).rpc();
  // });

  // const wallet = anchor.workspace.AccountTypes.provider.wallet;

  // it("Load account with accountInfo", async () => {
  //   const newKeypair = anchor.web3.Keypair.generate();
  //   const tx = new anchor.web3.Transaction().add(
  //     anchor.web3.SystemProgram.createAccount({
  //       fromPubkey: wallet.publicKey,
  //       newAccountPubkey: newKeypair.publicKey,
  //       space: 16,
  //       lamports: await anchor.getProvider().connection.getMinimumBalanceForRentExemption(32),
  //       programId: program.programId,
  //     })
  //   );

  //   await anchor.web3.sendAndConfirmTransaction(
  //     anchor.getProvider().connection,
  //     tx,
  //     [wallet.payer, newKeypair],
  //   );

  //   await program.methods.foo().accounts({someAccount: newKeypair.publicKey}).rpc();
  // });
});
