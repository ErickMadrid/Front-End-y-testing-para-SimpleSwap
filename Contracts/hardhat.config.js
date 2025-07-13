require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("solidity-coverage");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};



