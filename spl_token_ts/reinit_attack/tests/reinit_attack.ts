import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ReinitAttack } from "../target/types/reinit_attack";

describe("reinit_attack", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.reinitAttack as Program<ReinitAttack>;

  it("Is initialized!", async () => {
    const [myPda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);

    await program.methods.initialize().accounts({myPda: myPda}).rpc();

    await program.methods.giveToSystemProgram().accounts({myPda: myPda}).rpc();

    await program.methods.initialize().accounts({myPda: myPda}).rpc();
    console.log("account initialized after giving to system program!");

    await program.methods.drainLamports().accounts({myPda: myPda}).rpc();

    await program.methods.initialize().accounts({myPda: myPda}).rpc();
    console.log("account initialized after draining lamports!");
  });
});
