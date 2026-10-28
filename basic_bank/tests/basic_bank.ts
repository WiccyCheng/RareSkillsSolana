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

  const [userAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("user-account"), signer.publicKey.toBuffer()],
    program.programId
  );

  it("Initializes the bank account", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        bank: bankAccount.publicKey,
        payer: signer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bankAccount])
      .rpc();

    console.log("Initialize transaction signature", tx);

    const bankData = await program.account.bank.fetch(bankAccount.publicKey);

    assert.equal(bankData.totalDeposits.toString(), "0");
  });

  it("Creates a user account", async () => {
    const tx = await program.methods
      .createUserAccount()
      .accounts({
        bank: bankAccount.publicKey,
        userAccount: userAccountPDA,
        user: signer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create user account transaction signature", tx);

    const userAccountData = await program.account.userAccount.fetch(
      userAccountPDA
    );
    assert.equal(userAccountData.owner.toString(), signer.publicKey.toString());
    assert.equal(userAccountData.balance.toString(), "0");
  });

  it("Deposits funds into the bank", async () => {
    const initialUserBalance = await provider.connection.getBalance(
      signer.publicKey
    );
    const initialBankBalance = await provider.connection.getBalance(
      bankAccount.publicKey
    );

    console.log(`Initial user SOL balance: ${initialUserBalance / 1e9} SOL`);
    console.log(`Initial bank SOL balance: ${initialBankBalance / 1e9} SOL`);

    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        bank: bankAccount.publicKey,
        userAccount: userAccountPDA,
        user: signer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit transaction signature", tx);

    const userAccountData = await program.account.userAccount.fetch(
      userAccountPDA
    );

    assert.equal(userAccountData.balance.toString(), depositAmount.toString());

    const bankData = await program.account.bank.fetch(bankAccount.publicKey);
    assert.equal(bankData.totalDeposits.toString(), depositAmount.toString());

    const finalUserBalance = await provider.connection.getBalance(
      signer.publicKey
    );
    const finalBankBalance = await provider.connection.getBalance(
      bankAccount.publicKey
    );

    console.log(`final user SOL balance: ${finalUserBalance / 1e9} SOL`);
    console.log(`final bank SOL balance: ${finalBankBalance / 1e9} SOL`);

    assert.isTrue(finalBankBalance > initialBankBalance);

    assert.isTrue(
      finalUserBalance < initialUserBalance - Number(depositAmount)
    );
    assert.isTrue(
      finalUserBalance > initialUserBalance - Number(depositAmount) - 10000
    );
  });

  it("Retrieves user balance", async () => {
    const balance = await program.methods
      .getBalance()
      .accounts({
        bank: bankAccount.publicKey,
        userAccount: userAccountPDA,
        user: signer.publicKey,
      })
      .view();

    assert.equal(balance.toString(), depositAmount.toString());

    console.log(`User balance: ${Number(balance) / 1e9} SOL`);
  });

  it("Withdraws funds from the bank", async () => {
    const userAccountData = await program.account.userAccount.fetch(
      userAccountPDA
    );
    const initialBalance = userAccountData.balance;

    const initialUserBalance = await provider.connection.getBalance(
      signer.publicKey
    );
    const initialBankBalance = await provider.connection.getBalance(
      bankAccount.publicKey
    );

    console.log(`Initial user SOL balance: ${initialUserBalance / 1e9} SOL`);
    console.log(`Initial bank SOL balance: ${initialBankBalance / 1e9} SOL`);

    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        bank: bankAccount.publicKey,
        userAccount: userAccountPDA,
        user: signer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const updateUserAccountData = await program.account.userAccount.fetch(
      userAccountPDA
    );
    const newBalance = updateUserAccountData.balance;

    const expectedBalance = initialBalance.sub(withdrawAmount);
    assert.equal(newBalance.toString(), expectedBalance.toString());

    const bankData = await program.account.bank.fetch(bankAccount.publicKey);
    assert.equal(bankData.totalDeposits.toString(), expectedBalance.toString());

    const finalUserBalance = await provider.connection.getBalance(
      signer.publicKey
    );
    const finalBankBalance = await provider.connection.getBalance(
      bankAccount.publicKey
    );

    console.log(`Final user SOL balance: ${finalUserBalance / 1e9} SOL`);
    console.log(`Final bank SOL balance: ${finalBankBalance / 1e9} SOL`);

    assert.isTrue(
      finalUserBalance < initialUserBalance + Number(withdrawAmount)
    );
    assert.isTrue(
      finalUserBalance > initialUserBalance + withdrawAmount.toNumber() - 10000
    );

    assert.equal(
      finalBankBalance,
      initialBankBalance - withdrawAmount.toNumber()
    );
  });

  it("Prevents users from withdrawing more than their balance", async () => {
    const userAccountBefore = await program.account.userAccount.fetch(
      userAccountPDA
    );
    const excessiveWithdrawAmount = userAccountBefore.balance.add(
      new anchor.BN(1)
    );

    try {
      await program.methods
        .withdraw(excessiveWithdrawAmount)
        .accounts({
          bank: bankAccount.publicKey,
          userAccount: userAccountPDA,
          user: signer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      assert.instanceOf(error, anchor.AnchorError);
      assert.equal(error.error.errorCode.code, "InsufficientBalance");
      const userAccountAfter = await program.account.userAccount.fetch(
        userAccountPDA
      );
      assert.equal(
        userAccountAfter.balance.toString(),
        userAccountBefore.balance.toString()
      );
      return;
    }

    assert.fail("Should have thrown an error for insufficient balance");
  });
});
