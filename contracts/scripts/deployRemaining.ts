/**
 * Deploy Remaining Contracts Script
 * Deploys TippingPool and EchoRegistry using existing VoiceNoteNFT address
 * 
 * Usage:
 *   bun hardhat run scripts/deployRemaining.ts --network arbitrumSepolia
 */

import { ethers } from "hardhat";

// VoiceNoteNFT already deployed on Arbitrum Sepolia
const EXISTING_NFT_ADDRESS = "0xA3505e375C6d8CB1f0b3C934b30b93EF8f3211c5";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("══════════════════════════════════════════════════════════");
  console.log("  MIDNIGHT RADIO - Deploy Remaining Contracts");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Using VoiceNoteNFT: ${EXISTING_NFT_ADDRESS}`);
  console.log("══════════════════════════════════════════════════════════\n");

  // 1. Deploy TippingPool (requires treasury + NFT address)
  console.log("1. Deploying TippingPool...");
  const TippingPool = await ethers.getContractFactory("TippingPool");
  const tipping = await TippingPool.deploy(deployer.address, EXISTING_NFT_ADDRESS);
  await tipping.waitForDeployment();
  const tippingAddress = await tipping.getAddress();
  console.log(`   ✅ TippingPool deployed: ${tippingAddress}`);

  // 2. Deploy EchoRegistry (requires treasury)
  console.log("\n2. Deploying EchoRegistry...");
  const EchoRegistry = await ethers.getContractFactory("EchoRegistry");
  const echo = await EchoRegistry.deploy(deployer.address);
  await echo.waitForDeployment();
  const echoAddress = await echo.getAddress();
  console.log(`   ✅ EchoRegistry deployed: ${echoAddress}`);

  // Summary
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  VoiceNoteNFT:  ${EXISTING_NFT_ADDRESS} (existing)`);
  console.log(`  TippingPool:   ${tippingAddress}`);
  console.log(`  EchoRegistry:  ${echoAddress}`);
  console.log("══════════════════════════════════════════════════════════");
  
  // Output for easy copy-paste to .env
  console.log("\n📋 Copy to backend/.env:");
  console.log(`ARBITRUM_NFT_CONTRACT_ADDRESS=${EXISTING_NFT_ADDRESS}`);
  console.log(`ARBITRUM_TIPPING_CONTRACT_ADDRESS=${tippingAddress}`);
  console.log(`ARBITRUM_ECHO_CONTRACT_ADDRESS=${echoAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
