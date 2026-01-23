import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day24 } from "../target/types/day24";

async function airdropSol(publicKey, amount) {
  let airdropX = await anchor.getProvider().connection.requestAirdrop(publicKey, amount);
  await confirmTransaction(airdropX);
}

async function confirmTransaction(tx) {
  const latestBlockHash = await anchor.getProvider().connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: tx,
  });
}

describe("day24", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day24 as Program<Day24>;

  it("Is initialized!", async () => {
    const alice = anchor.web3.Keypair.generate();
    const bob = anchor.web3.Keypair.generate();

    const air_drop_alice_tx = await anchor.getProvider().connection.requestAirdrop(alice.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const air_drop_bob_tx = await anchor.getProvider().connection.requestAirdrop(bob.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    await confirmTransaction(air_drop_alice_tx);
    await confirmTransaction(air_drop_bob_tx);

    let seeds = [];
    const [myStorage, _bump] = await anchor.web3.PublicKey.findProgramAddress(seeds, program.programId);

    await program.methods.initialize().accounts({ myStorage: myStorage, foo: alice.publicKey}).signers([alice]).rpc();
    await program.methods.updateValue(new anchor.BN(42)).accounts({ myStorage: myStorage, foo: bob.publicKey}).signers([bob]).rpc();

    let value = await program.account.myStorage.fetch(myStorage);
    console.log(`value stored is ${value.x}`);
  });
});
