import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function main() {
  const hre = require("hardhat");
  const ethers = hre.ethers;
  console.log("Starting deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy VoteRightToken
  console.log("\nDeploying VoteRightToken...");
  const VoteRightToken = await ethers.getContractFactory("VoteRightToken");
  const tokenContract = await VoteRightToken.deploy();
  await tokenContract.deployed();
  console.log("VoteRightToken deployed to:", tokenContract.address);

  // Deploy VoteVerification
  console.log("\nDeploying VoteVerification...");
  const VoteVerification = await ethers.getContractFactory("VoteVerification");
  const verificationContract = await VoteVerification.deploy(deployer.address);
  await verificationContract.deployed();
  console.log("VoteVerification deployed to:", verificationContract.address);

  // Setup roles and permissions
  console.log("\nSetting up roles and permissions...");
  const MINTER_ROLE = await tokenContract.MINTER_ROLE();
  await tokenContract.grantRole(MINTER_ROLE, verificationContract.address);
  console.log("Granted MINTER_ROLE to VoteVerification contract");

  // Verify deployment
  console.log("\nDeployment complete! Contract addresses:");
  console.log("VoteRightToken:", tokenContract.address);
  console.log("VoteVerification:", verificationContract.address);

  // Save deployment info for verification
  console.log("\nSave these values in your .env.local file:");
  console.log(`NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=${tokenContract.address}`);
  console.log(`NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=${verificationContract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 