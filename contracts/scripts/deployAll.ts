/**
 * Deploy All Contracts Script
 * Deploys VoiceNoteNFT, TippingPool, and EchoRegistry to any network
 * 
 * Usage:
 *   bun hardhat run scripts/deployAll.ts --network arbitrumSepolia
 *   bun hardhat run scripts/deployAll.ts --network mantleTestnet
 */

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("══════════════════════════════════════════════════════════");
  console.log("  MIDNIGHT RADIO - Contract Deployment");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance: ${ethers.formatEther(balance)} ${network.chainId === 421614n ? 'ETH' : 'MNT'}`);
  console.log("══════════════════════════════════════════════════════════\n");

  // 1. Deploy VoiceNoteNFT
  console.log("1. Deploying VoiceNoteNFT...");
  const VoiceNoteNFT = await ethers.getContractFactory("VoiceNoteNFT");
  const nft = await VoiceNoteNFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`   ✅ VoiceNoteNFT deployed: ${nftAddress}`);

  // 2. Deploy TippingPool (requires treasury + NFT address)
  console.log("\n2. Deploying TippingPool...");
  const TippingPool = await ethers.getContractFactory("TippingPool");
  const tipping = await TippingPool.deploy(deployer.address, nftAddress);
  await tipping.waitForDeployment();
  const tippingAddress = await tipping.getAddress();
  console.log(`   ✅ TippingPool deployed: ${tippingAddress}`);

  // 3. Deploy EchoRegistry (requires treasury)
  console.log("\n3. Deploying EchoRegistry...");
  const EchoRegistry = await ethers.getContractFactory("EchoRegistry");
  const echo = await EchoRegistry.deploy(deployer.address);
  await echo.waitForDeployment();
  const echoAddress = await echo.getAddress();
  console.log(`   ✅ EchoRegistry deployed: ${echoAddress}`);

  // Summary
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  VoiceNoteNFT:  ${nftAddress}`);
  console.log(`  TippingPool:   ${tippingAddress}`);
  console.log(`  EchoRegistry:  ${echoAddress}`);
  console.log("══════════════════════════════════════════════════════════");
  
  // Output for easy copy-paste to .env
  console.log("\n📋 Copy to .env:");
  if (network.chainId === 421614n) {
    console.log(`ARBITRUM_NFT_CONTRACT_ADDRESS=${nftAddress}`);
    console.log(`ARBITRUM_TIPPING_CONTRACT_ADDRESS=${tippingAddress}`);
    console.log(`ARBITRUM_ECHO_CONTRACT_ADDRESS=${echoAddress}`);
  } else {
    console.log(`NFT_CONTRACT_ADDRESS=${nftAddress}`);
    console.log(`TIPPING_CONTRACT_ADDRESS=${tippingAddress}`);
    console.log(`ECHO_CONTRACT_ADDRESS=${echoAddress}`);
  }
  
  // Verification commands
  console.log("\n🔍 Verify contracts:");
  console.log(`bun hardhat verify --network ${network.name} ${nftAddress} ${deployer.address}`);
  console.log(`bun hardhat verify --network ${network.name} ${tippingAddress} ${deployer.address}`);
  console.log(`bun hardhat verify --network ${network.name} ${echoAddress} ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
