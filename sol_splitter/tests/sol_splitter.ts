import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolSplitter } from "../target/types/sol_splitter";

describe("sol_splitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.solSplitter as Program<SolSplitter>;

  async function printAccountBalance(account) {
    const balance = await anchor.getProvider().connection.getBalance(account);
    console.log(`Account ${account.toBase58()} balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  }

  it("Split SOL", async () => {
    const recipient1 = anchor.web3.Keypair.generate();
    const recipient2 = anchor.web3.Keypair.generate();
    const recipient3 = anchor.web3.Keypair.generate();

    await printAccountBalance(recipient1.publicKey);
    await printAccountBalance(recipient2.publicKey);
    await printAccountBalance(recipient3.publicKey);

    const accountMeta1 = { pubkey: recipient1.publicKey, isSigner: false, isWritable: true };
    const accountMeta2 = { pubkey: recipient2.publicKey, isSigner: false, isWritable: true };
    const accountMeta3 = { pubkey: recipient3.publicKey, isSigner: false, isWritable: true };

    let amount = new anchor.BN(3 * anchor.web3.LAMPORTS_PER_SOL); // 3 SOL
    await program.methods.splitSol(amount).remainingAccounts([accountMeta1, accountMeta2, accountMeta3]).rpc();

    await printAccountBalance(recipient1.publicKey);
    await printAccountBalance(recipient2.publicKey);
    await printAccountBalance(recipient3.publicKey);
  });
});
