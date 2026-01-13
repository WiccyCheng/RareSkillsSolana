import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfund } from "../target/types/crowdfund";

describe("crowdfund", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crowdfund as Program<Crowdfund>;

  it("Is initialized!", async () => {
    const programId = await program.account.pda.programId;

    let seeds = [];
    let pdaAccount = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId)[0];

    const tx = await program.methods.initialize().accounts({pda: pdaAccount}).rpc();

    const tx2 = await program.methods.donate(new anchor.BN(2_000_000_000)).accounts({pda: pdaAccount}).rpc();

    console.log("lamport balance of pdaAccount", await anchor.getProvider().connection.getBalance(pdaAccount));

    await program.methods.withdraw(new anchor.BN(1_000_000_000)).accounts({pda: pdaAccount}).rpc();

    console.log("lamport balance of pdaAccount", await anchor.getProvider().connection.getBalance(pdaAccount));

    console.log("lamport balance of signer", await anchor.getProvider().connection.getBalance(anchor.getProvider().publicKey));
  });
});
