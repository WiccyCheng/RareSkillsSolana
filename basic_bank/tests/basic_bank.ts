import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { BasicBank } from "../target/types/basic_bank";

describe("basic_bank", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.basicBank as Program<BasicBank>;
  const provider = anchor.AnchorProvider.env();

  const bankAccount = Keypair.generate();

  const signer = provider.wallet;

  const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL
  const withdrawAmount = new anchor.BN(500_000_000); // 0.5 SOL

  const [userAccountPDA] = PublicKey.findProgramAddressSync([Buffer.from("user-account"), signer.publicKey.toBuffer()], program.programId);

  it("Initializes the bank account", async () => {
    const tx = await program.methods.initialize().accounts({
      bank: bankAccount.publicKey,
      payer: signer.publicKey,
      systemProgram: SystemProgram.programId,
    }).signers([bankAccount]).rpc();

    console.log("Initialize transaction signature", tx);

    const bankData = await program.account.bank.fetch(bankAccount.publicKey);

    assert.equal(bankData.totalDeposits.toString(), "0");
  });

  it("Creates a user account", async () => {
    const tx = await program.methods.createUserAccount().accounts({
      bank: bankAccount.publicKey,
      userAccount: userAccountPDA,
      user: signer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    console.log("Create user account transaction signature", tx);

    const userAccountData = await program.account.userAccount.fetch(userAccountPDA);
    assert.equal(userAccountData.owner.toString(), signer.publicKey.toString());
    assert.equal(userAccountData.balance.toString(), "0");
  });

  it("Deposits funds into the bank", async () => {
    const initialUserBalance = await provider.connection.getBalance(signer.publicKey);
    const initialBankBalance = await provider.connection.getBalance(bankAccount.publicKey);

    console.log(`Initial user SOL balance: ${initialUserBalance / 1e9} SOL`);
    console.log(`Initial bank SOL balance: ${initialBankBalance / 1e9} SOL`);

    const tx = await program.methods.deposit(depositAmount).accounts({
      bank: bankAccount.publicKey,
      userAccount: userAccountPDA,
      user: signer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    console.log("Deposit transaction signature", tx);

    const userAccountData = await program.account.userAccount.fetch(userAccountPDA);

    assert.equal(userAccountData.balance.toString(), depositAmount.toString());

    const bankData = await program.account.bank.fetch(bankAccount.publicKey);
    assert.equal(bankData.totalDeposits.toString(), depositAmount.toString());

    const finalUserBalance = await provider.connection.getBalance(signer.publicKey);
    const finalBankBalance = await provider.connection.getBalance(bankAccount.publicKey);

    console.log(`final user SOL balance: ${finalUserBalance / 1e9} SOL`);
    console.log(`final bank SOL balance: ${finalBankBalance / 1e9} SOL`);

    assert.isTrue(finalBankBalance > initialBankBalance);

    assert.isTrue(finalUserBalance < initialUserBalance - Number(depositAmount));
    assert.isTrue(finalUserBalance > initialUserBalance - Number(depositAmount) - 10000);
  });
});
