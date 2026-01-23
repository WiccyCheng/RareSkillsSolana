import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SplTokenTs } from "../target/types/spl_token_ts";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.SplTokenTs as Program<SplTokenTs>;

async function main() {
  // 部署程序
  console.log("Deploying spl_token_ts program...");
  
  // 如果需要初始化，可以在这里调用
  // const tx = await program.methods.initialize().rpc();
  // console.log("Initialized transaction:", tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
