require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env.local" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    somnia: {
      url: process.env.SOMNIA_RPC_URL || "https://testnet.somnia.network",
      chainId: parseInt(process.env.SOMNIA_CHAIN_ID) || 2323,
      accounts: process.env.WALLET_PRIVATE_KEY ? [process.env.WALLET_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000,
    },
    hardhat: {
      chainId: 1337
    }
  },
  etherscan: {
    apiKey: {
      somnia: process.env.SOMNIA_API_KEY || "api-key"
    },
    customChains: [
      {
        network: "somnia",
        chainId: parseInt(process.env.SOMNIA_CHAIN_ID) || 2323,
        urls: {
          apiURL: process.env.SOMNIA_EXPLORER_URL + "/api" || "https://explorer.testnet.somnia.network/api",
          browserURL: process.env.SOMNIA_EXPLORER_URL || "https://explorer.testnet.somnia.network"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};