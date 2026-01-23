import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day26 } from "../target/types/day26";

async function airdropSol(publicKey, amount) {
  const lamports = amount * anchor.web3.LAMPORTS_PER_SOL;
  let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, lamports);
  await confirmTransaction(airdropTx);
}

async function confirmTransaction(tx) {
  await anchor.getProvider().connection.confirmTransaction(tx);
}

describe("day26", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.day26 as Program<Day26>;
  it("Is initialized!", async () => {
    console.log("program address:", program.programId.toBase58());
    const seeds = [];
    const [pda, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
    console.log("derived pda:", pda.toBase58());
    console.log("owner of pad before initialize:", await anchor.getProvider().connection.getAccountInfo(pda));
    await program.methods.initializePda().accounts({ pda: pda }).rpc();
    console.log("owner of pda after initialize:", (await anchor.getProvider().connection.getAccountInfo(pda)));

    let keypair = anchor.web3.Keypair.generate();
    console.log("generated keypair:", keypair.publicKey.toBase58());
    console.log("owner of keypair before airdrop:", await anchor.getProvider().connection.getAccountInfo(keypair.publicKey));
    await airdropSol(keypair.publicKey, 1);
    console.log("owner of keypair after airdrop:", (await anchor.getProvider().connection.getAccountInfo(keypair.publicKey)).owner.toBase58());

    await program.methods.initializeKeypair().accounts({ keypair: keypair.publicKey }).signers([keypair]).rpc();
    console.log("owner of keypair after initialize:", (await anchor.getProvider().connection.getAccountInfo(keypair.publicKey)).owner.toBase58());
  });
});
