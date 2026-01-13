import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountRent } from "../target/types/account_rent";

describe("account_rent", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.accountRent as Program<AccountRent>;

  it("Is initialized!", async () => {
    // Generate a new keypair for the foo account
    const fooKeypair = anchor.web3.Keypair.generate();
    
    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          foo: fooKeypair.publicKey,
          user: program.provider.publicKey,
        })
        .signers([fooKeypair])
        .rpc();
      
      console.log("Your transaction signature", tx);
      console.log("Successfully created large account with 10241 bytes");
    } catch (error) {
      console.error("Error creating large account:", error);
      
      // 如果是账户太大的错误，我们可以捕获并分析
      if (error.toString().includes("Account data too large")) {
        console.log("Account size limit exceeded! This is expected for very large accounts.");
      } else if (error.toString().includes("insufficient")) {
        console.log("Insufficient funds to pay for account rent. This account needs significant SOL.");
      }
      
      throw error;
    }
  });

  it("Test realloc to increase account size", async () => {
    // 生成一个新的 PDA 账户用于 realloc 测试
    const [myStoragePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [], // seeds 为空
      program.programId
    );

    try {
      console.log("Attempting to use realloc to increase account size...");
      
      // 直接使用 realloc 功能
      const reallocTx = await program.methods
        .increaseAccountSize()
        .accountsPartial({
          myStorage: myStoragePda,
          signer: program.provider.publicKey,
        })
        .rpc();

      console.log("Account size increased with realloc:", reallocTx);
      console.log("Successfully used realloc to bypass size limits");
      
    } catch (error) {
      console.error("Error with realloc:", error);
      
      if (error.toString().includes("AccountNotFound")) {
        console.log("Account not found - this is expected for first realloc call");
      } else if (error.toString().includes("insufficient")) {
        console.log("Insufficient funds for realloc operation");
      } else if (error.toString().includes("InvalidAccountData")) {
        console.log("Invalid account data for realloc");
      } else if (error.toString().includes("ConstraintHasOne")) {
        console.log("Constraint error - account validation failed");
      }
      
      // 不抛出错误，让我们看看具体的错误信息
      console.log("Full error details:", JSON.stringify(error, null, 2));
    }
  });

  it("Test extremely large realloc", async () => {
    // 测试非常大的 realloc，看看系统限制
    const [bigStoragePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("big_storage")], // 使用不同的 seed
      program.programId
    );

    try {
      console.log("Attempting to create and realloc to extremely large size...");
      
      // 尝试创建一个非常大的账户
      const reallocTx = await program.methods
        .increaseAccountSize()
        .accountsPartial({
          myStorage: bigStoragePda,
          signer: program.provider.publicKey,
        })
        .rpc();

      console.log("Extremely large realloc succeeded:", reallocTx);
      
    } catch (error) {
      console.error("Expected error with extremely large realloc:", error);
      
      // 分析不同类型的错误
      if (error.toString().includes("AccountDataTooLarge")) {
        console.log("✅ Hit account data size limit - this is expected");
      } else if (error.toString().includes("insufficient")) {
        console.log("✅ Insufficient funds - need more SOL for such large account");
      } else if (error.toString().includes("InvalidAccountData")) {
        console.log("✅ Invalid account data - realloc constraints failed");
      } else {
        console.log("❓ Unexpected error type");
      }
    }
  });
});
