/**
 * Deployment script for VoteRight smart contracts
 * 
 * This script deploys the VoteRightToken and VoteVerification contracts
 * to the specified network and outputs their addresses.
 * 
 * Usage:
 * - Configure environment in .env file
 * - Run with: npx hardhat run scripts/deploy-contracts.ts --network <network_name>
 */
import { ethers } from "hardhat";

async function main(): Promise<void> {
  console.log("Deploying VoteRight smart contracts...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.utils.formatEther(await deployer.getBalance())}`);
  
  try {
    // Deploy VoteRightToken
    console.log("\nDeploying VoteRightToken...");
    const VoteRightToken = await ethers.getContractFactory("VoteRightToken");
    const tokenContract = await VoteRightToken.deploy();
    await tokenContract.deployed();
    
    console.log(`VoteRightToken deployed to: ${tokenContract.address}`);
    
    // Deploy VoteVerification with the deployer as the initial verifier
    console.log("\nDeploying VoteVerification...");
    const VoteVerification = await ethers.getContractFactory("VoteVerification");
    const verificationContract = await VoteVerification.deploy(deployer.address);
    await verificationContract.deployed();
    
    console.log(`VoteVerification deployed to: ${verificationContract.address}`);
    
    // Set up roles and permissions
    console.log("\nSetting up roles and permissions...");
    
    // Grant MINTER_ROLE to the verification contract
    const MINTER_ROLE = await tokenContract.MINTER_ROLE();
    await tokenContract.grantRole(MINTER_ROLE, verificationContract.address);
    console.log(`Granted MINTER_ROLE to VoteVerification contract`);
    
    // Output deployment summary
    console.log("\n=== Deployment Summary ===");
    console.log(`Network: ${ethers.provider.network.name}`);
    console.log(`VoteRightToken: ${tokenContract.address}`);
    console.log(`VoteVerification: ${verificationContract.address}`);
    console.log("========================\n");
    
    // Update contract addresses in appropriate files
    console.log("Please update the contract addresses in lib/blockchain/contract-addresses.ts");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
