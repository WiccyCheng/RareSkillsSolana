import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bob } from "../target/types/bob";
import { Alice } from "../target/types/alice";
import { expect } from "chai";

describe("CPI from Alice to Bob", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const bobProgram = anchor.workspace.bob as Program<Bob>;
  const aliceProgram = anchor.workspace.alice as Program<Alice>;
  const dataAccountKeypair = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    const tx = await bobProgram.methods.initialize()
    .accounts({
      bobDataAccount: dataAccountKeypair.publicKey,
      signer: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([dataAccountKeypair])
    .rpc();
  });

  it("Can add numbers then double!", async () =>{
    const tx = await aliceProgram.methods.askBobToAdd(new anchor.BN(4), new anchor.BN(2))
    .accounts({
      bobDataAccount: dataAccountKeypair.publicKey,
      bobProgram: bobProgram.programId,
    })
    .rpc();
  });

  it("Can assert value in Bob's data account equals 4 + 2", async () => {
    const BobAccountValue = (await bobProgram.account.bobData.fetch(dataAccountKeypair.publicKey)).result.toNumber();
    expect(BobAccountValue).to.equal(4 + 2);
  });
});