import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day14 } from "../target/types/day14";

describe("day14", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Day14 as Program<Day14>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  let keypair = anchor.web3.Keypair.generate();

  it("Is called by the owner", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accounts({
        // signerAccount: keypair.publicKey,
        signerAccount: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Transaction hash:", tx);
  });
});