const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy TakoA
  const TokenA = await ethers.getContractFactory("contracts/TakoA.sol:TakoA");
  const tokenA = await TokenA.deploy(deployer.address, deployer.address);
  await tokenA.waitForDeployment();
  console.log("TakoA deployed at:", tokenA.target);

  // Deploy TakoB
  const TokenB = await ethers.getContractFactory("contracts/TakoB.sol:TakoB");
  const tokenB = await TokenB.deploy(deployer.address, deployer.address);
  await tokenB.waitForDeployment();
  console.log("TakoB deployed at:", tokenB.target);

  // Deploy SimpleSwap
  const SimpleSwap = await ethers.getContractFactory("contracts/SimpleSwap.sol:SimpleSwap");
  const swap = await SimpleSwap.deploy(tokenA.target, tokenB.target);
  await swap.waitForDeployment();
  console.log("SimpleSwap deployed at:", swap.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


