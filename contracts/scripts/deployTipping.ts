import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying TippingPool with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Treasury is the deployer's address (platform wallet)
  const treasury = deployer.address;
  
  // Existing VoiceNoteNFT address
  const voiceNoteNFT = "0x161fcd77CDb443D31A7907E6B796b9eef0D1e8Ac";

  console.log("\nDeploying TippingPool...");
  console.log("Treasury:", treasury);
  console.log("VoiceNoteNFT:", voiceNoteNFT);
  
  const TippingPool = await ethers.getContractFactory("TippingPool");
  const tippingPool = await TippingPool.deploy(treasury, voiceNoteNFT);
  await tippingPool.waitForDeployment();
  const tippingPoolAddress = await tippingPool.getAddress();
  
  console.log("\n========================================");
  console.log("TippingPool deployed to:", tippingPoolAddress);
  console.log("Platform fee: 40%");
  console.log("Broadcaster share: 60%");
  console.log("========================================");
  console.log("\nAdd to your backend .env:");
  console.log(`TIPPING_CONTRACT_ADDRESS=${tippingPoolAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
