import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying VoiceNoteNFT with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Treasury is the deployer's address (platform wallet)
  const treasury = deployer.address;

  console.log("\nDeploying VoiceNoteNFT...");
  console.log("Treasury:", treasury);
  
  const VoiceNoteNFT = await ethers.getContractFactory("VoiceNoteNFT");
  const voiceNoteNFT = await VoiceNoteNFT.deploy(treasury);
  await voiceNoteNFT.waitForDeployment();
  const voiceNoteNFTAddress = await voiceNoteNFT.getAddress();
  
  console.log("\n========================================");
  console.log("VoiceNoteNFT deployed to:", voiceNoteNFTAddress);
  console.log("Free mints per day: 1");
  console.log("Mint fee after free: 0.01 MNT");
  console.log("========================================");
  console.log("\nAdd to your backend .env:");
  console.log(`NFT_CONTRACT_ADDRESS=${voiceNoteNFTAddress}`);
  console.log("\nUpdate frontend/src/lib/contracts.ts:");
  console.log(`VOICE_NOTE_NFT_ADDRESS: "${voiceNoteNFTAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
