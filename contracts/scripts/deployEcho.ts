import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying EchoRegistry with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Treasury address is the deployer for now
  const treasuryAddress = deployer.address;

  // Deploy EchoRegistry
  console.log("\nDeploying EchoRegistry...");
  const EchoRegistry = await ethers.getContractFactory("EchoRegistry");
  const echoRegistry = await EchoRegistry.deploy(treasuryAddress);
  await echoRegistry.waitForDeployment();
  const echoRegistryAddress = await echoRegistry.getAddress();

  console.log("\n========================================");
  console.log("EchoRegistry deployed to:", echoRegistryAddress);
  console.log("========================================");
  console.log("\nAdd to your backend .env:");
  console.log(`ECHO_CONTRACT_ADDRESS=${echoRegistryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
