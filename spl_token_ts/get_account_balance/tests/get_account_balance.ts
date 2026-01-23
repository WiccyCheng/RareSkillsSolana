import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GetAccountBalance } from "../target/types/get_account_balance";

describe("get_account_balance", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.getAccountBalance as Program<GetAccountBalance>;
  let pubkey = new anchor.web3.PublicKey("4JQYfN4bFZvCbdE7Gn83AAEhXx6QgRAXdb4VLTNiSX2f");

  it("Is initialized!", async () => {

    const tx = await program.methods.initialize().accounts({ acct: pubkey }).rpc();
    console.log("Your transaction signature", tx);
  });
});
