import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Read } from "../target/types/read";
import { readFileSync } from "fs";

describe("read", () => {
  // Configure the client to use the local cluster or ANCHOR_PROVIDER_URL if provided.
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL ?? "http://127.0.0.1:8899";
  const provider = AnchorProvider.local(rpcUrl);
  anchor.setProvider(provider);

  it("Read other account", async () => {
    // Add your test here.
    const otherProgramAddress = "HVW2rZJzmMoByFYEWmAYQzpNMJaimd21PAwF6Ld3AaR7";
    const otherProgramId = new anchor.web3.PublicKey(otherProgramAddress);

    const otherIdl: any = JSON.parse(
      readFileSync("../other_program/target/idl/other_program.json", "utf8")
    );

    // Ensure the Program has the correct address on the IDL (required by Anchor 0.31+)
    otherIdl.address = otherProgramId.toBase58();

    // Instantiate Program using provider; programId is taken from idl.address
    const otherProgram = new anchor.Program<any>(otherIdl, provider);

    const seeds = []
    const [trueOrFalseAcc, _bump] =
      anchor.web3.PublicKey.findProgramAddressSync(seeds, otherProgramId);
  let otherStorageStruct = await (otherProgram.account as any)["trueOrFalse"].fetch(trueOrFalseAcc);

    console.log("otherStorageStruct:", otherStorageStruct.flag.toString());
  });
});
