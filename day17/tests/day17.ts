import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day17 } from "../target/types/day17";

describe("day17", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day17 as Program<Day17>;
  const [myStoragePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("my_storage")],
    program.programId
  );

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Initialize tx:", tx);
  });

  it("Is set!", async () => {
    const tx = await program.methods.set(new anchor.BN(1234)).rpc();
    console.log("Set tx:", tx);
  });

  it("Is print!", async () => {
    await program.methods.printX().rpc();
    const acct = await program.account.myStorage.fetch(myStoragePda);
    console.log("Now the x is", acct.x.toString());
  });

  it("Is read and increment!", async () => {
    const currentX = await program.methods.readAndIncrement().rpc();
    const acct = await program.account.myStorage.fetch(myStoragePda);
    console.log("Read x and incremented, previous x was", currentX.toString(), "now x is", acct.x.toString());
  });
});
