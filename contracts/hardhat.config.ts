import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mantleTestnet: {
      url: process.env.MANTLE_TESTNET_RPC || "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    mantle: {
      url: process.env.MANTLE_MAINNET_RPC || "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      mantleTestnet: "no-api-key-needed",
      mantle: "no-api-key-needed",
    },
    customChains: [
      {
        network: "mantleTestnet",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
    ],
  },
};

export default config;
