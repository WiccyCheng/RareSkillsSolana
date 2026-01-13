import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DataReader } from "../target/types/data_reader";

describe("data_reader", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.dataReader as Program<DataReader>;

  it("Is initialized!", async () => {
    const otherStorageAddress = "HkpT7ruqnCYBvDXfeXqpYVkg1417uZMGWXhRP1Hniwno";

    const pub_key_other_storage = new anchor.web3.PublicKey(otherStorageAddress);

    const tx = await program.methods.readOtherData().accounts({
      otherData: pub_key_other_storage,
    }).rpc();
  });
});
