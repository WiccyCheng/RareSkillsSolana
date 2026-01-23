import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import fs from 'fs'
let idl = JSON.parse(fs.readFileSync('target/idl/program_deploy.json', 'utf-8'))

describe("deployed", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  // Change this to be your programID
  const programID = "GGtwujGb5v78R7DNS3Vnsc2AL3oBa6BgkcNHwb7c4rHd";
  const program = new Program(idl, programID, anchor.getProvider());

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});