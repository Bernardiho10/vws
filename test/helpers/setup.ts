import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import hre from "hardhat";

export interface TestContext {
  deployer: SignerWithAddress;
  admin: SignerWithAddress;
  verifier: SignerWithAddress;
  voter1: SignerWithAddress;
  voter2: SignerWithAddress;
  tokenContract: Contract;
  verificationContract: Contract;
}

export async function setupTestContext(): Promise<TestContext> {
  const [deployer, admin, verifier, voter1, voter2] = await hre?.ethers?.getSigners();
  
  // Deploy VoteRightToken
  const VoteRightToken = await hre?.ethers?.getContractFactory("VoteRightToken");
  const tokenContract = await VoteRightToken.deploy();
  await tokenContract.deployed();
  
  // Deploy VoteVerification
  const VoteVerification = await hre?.ethers?.getContractFactory("VoteVerification");
  const verificationContract = await VoteVerification.deploy(verifier.address);
  await verificationContract.deployed();
  
  // Grant MINTER_ROLE to verification contract
  const MINTER_ROLE = await tokenContract.MINTER_ROLE();
  await tokenContract.grantRole(MINTER_ROLE, verificationContract.address);
  
  return {
    deployer,
    admin,
    verifier,
    voter1,
    voter2,
    tokenContract,
    verificationContract
  };
}

export const ONE_DAY = 86400;
export const NOW = Math.floor(Date.now() / 1000); 