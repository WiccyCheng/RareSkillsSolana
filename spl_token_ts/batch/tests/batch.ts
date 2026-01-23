import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Batch } from "../target/types/batch";

describe("batch", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.batch as Program<Batch>;

  it("Is initialized!", async () => {
    const wallet = anchor.workspace.Batch.provider.wallet.payer;
    const [pda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);

    console.log("PDA", pda.toBase58());
    let transaction = new anchor.web3.Transaction();
    
    let accountInfo = await anchor.getProvider().connection.getAccountInfo(pda);
    if (accountInfo == null || accountInfo.owner == program.programId || accountInfo.lamports == 0) {
      console.log("PDA needs to be initialized");
      const initializeTx = await program.methods.initialize().accounts({pda: pda}).transaction();
      transaction.add(initializeTx);
    }
    const setTx = await program.methods.set(5).accounts({pda: pda}).transaction();
    transaction.add(setTx);

    await anchor.web3.sendAndConfirmTransaction(anchor.getProvider().connection, transaction, [wallet]);

    const pdaAcc = await program.account.pda.fetch(pda);
    console.log("PDA value", pdaAcc.value);
  });
});
