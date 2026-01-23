import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ExampleMap } from "../target/types/example_map";

describe("example_map", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.exampleMap as Program<ExampleMap>;

  it("Is initialized and set value!", async () => {
    const key = new anchor.BN(1234);
    const value = new anchor.BN(4321);

    const seedBuffer = key.toArrayLike(Buffer, "le", 8);
    const [valueAccount, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [seedBuffer],
      program.programId
    );

    await program.methods.initialize(key).accounts({ val: valueAccount, }).rpc();

    await program.methods.set(key, value).accounts({ val: valueAccount, }).rpc();

    let result = await program.account.val.fetch(valueAccount);
    console.log("Value: ", result.value.toString());
  });
});
