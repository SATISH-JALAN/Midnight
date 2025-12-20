import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Treasury address is the deployer for now
  const treasuryAddress = deployer.address;

  // Deploy VoiceNoteNFT
  console.log("\n1. Deploying VoiceNoteNFT...");
  const VoiceNoteNFT = await ethers.getContractFactory("VoiceNoteNFT");
  const voiceNoteNFT = await VoiceNoteNFT.deploy(treasuryAddress);
  await voiceNoteNFT.waitForDeployment();
  const voiceNoteNFTAddress = await voiceNoteNFT.getAddress();
  console.log("   VoiceNoteNFT deployed to:", voiceNoteNFTAddress);

  // Deploy TippingPool
  console.log("\n2. Deploying TippingPool...");
  const TippingPool = await ethers.getContractFactory("TippingPool");
  const tippingPool = await TippingPool.deploy(treasuryAddress, voiceNoteNFTAddress);
  await tippingPool.waitForDeployment();
  const tippingPoolAddress = await tippingPool.getAddress();
  console.log("   TippingPool deployed to:", tippingPoolAddress);

  // Deploy EchoRegistry
  console.log("\n3. Deploying EchoRegistry...");
  const EchoRegistry = await ethers.getContractFactory("EchoRegistry");
  const echoRegistry = await EchoRegistry.deploy(treasuryAddress);
  await echoRegistry.waitForDeployment();
  const echoRegistryAddress = await echoRegistry.getAddress();
  console.log("   EchoRegistry deployed to:", echoRegistryAddress);

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("VoiceNoteNFT:", voiceNoteNFTAddress);
  console.log("TippingPool:", tippingPoolAddress);
  console.log("EchoRegistry:", echoRegistryAddress);
  console.log("Treasury:", treasuryAddress);
  console.log("========================================");
  console.log("\nUpdate your backend .env with:");
  console.log(`NFT_CONTRACT_ADDRESS=${voiceNoteNFTAddress}`);
  console.log(`TIPPING_CONTRACT_ADDRESS=${tippingPoolAddress}`);
  console.log(`ECHO_CONTRACT_ADDRESS=${echoRegistryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

