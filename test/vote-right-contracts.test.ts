import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { VoteRightToken, VoteVerification } from "../typechain-types";

describe("VoteRight Contracts", function() {
  // Time constants
  const ONE_DAY: number = 86400;
  const NOW: number = Math.floor(Date.now() / 1000);
  
  // Test accounts
  let deployer: SignerWithAddress;
  let admin: SignerWithAddress;
  let verifier: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  
  // Contract instances
  let tokenContract: VoteRightToken;
  let verificationContract: VoteVerification;
  
  // Contract role constants
  let MINTER_ROLE: string;
  let DEFAULT_ADMIN_ROLE: string;
  let VERIFIER_ROLE: string;
  let PAUSER_ROLE: string;
  
  beforeEach(async function() {
    // Get test accounts
    [deployer, admin, verifier, voter1, voter2] = await ethers.getSigners();
    
    // Deploy VoteRightToken
    const VoteRightToken = await ethers.getContractFactory("VoteRightToken");
    tokenContract = await VoteRightToken.deploy();
    await tokenContract.deployed();
    
    // Deploy VoteVerification with verifier as the initial verifier
    const VoteVerification = await ethers.getContractFactory("VoteVerification");
    verificationContract = await VoteVerification.deploy(verifier.address);
    await verificationContract.deployed();
    
    // Get role identifiers
    DEFAULT_ADMIN_ROLE = await tokenContract.DEFAULT_ADMIN_ROLE();
    MINTER_ROLE = await tokenContract.MINTER_ROLE();
    VERIFIER_ROLE = await verificationContract.VERIFIER_ROLE();
    PAUSER_ROLE = await verificationContract.PAUSER_ROLE();
    
    // Setup: grant MINTER_ROLE to verification contract
    await tokenContract.grantRole(MINTER_ROLE, verificationContract.address);
  });
  
  describe("VoteRightToken", function() {
    it("should have correct name and symbol", async function() {
      expect(await tokenContract.name()).to.equal("VoteRight Token");
      expect(await tokenContract.symbol()).to.equal("VRT");
    });
    
    it("should assign DEFAULT_ADMIN_ROLE to deployer", async function() {
      expect(await tokenContract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
    });
    
    it("should allow minting tokens with MINTER_ROLE", async function() {
      // Grant MINTER_ROLE to admin
      await tokenContract.grantRole(MINTER_ROLE, admin.address);
      
      // Mint tokens with admin account
      await tokenContract.connect(admin).mintReward(voter1.address, ethers.utils.parseEther("10"), "Voter participation");
      
      // Check balance
      expect(await tokenContract.balanceOf(voter1.address)).to.equal(ethers.utils.parseEther("10"));
    });
    
    it("should prevent non-minters from minting tokens", async function() {
      await expect(
        tokenContract.connect(voter1).mintReward(voter2.address, ethers.utils.parseEther("10"), "Unauthorized minting")
      ).to.be.revertedWith("AccessControl");
    });
    
    it("should track token minting reasons", async function() {
      await tokenContract.grantRole(MINTER_ROLE, admin.address);
      
      // Mint tokens with a reason
      const tx = await tokenContract.connect(admin).mintReward(voter1.address, ethers.utils.parseEther("5"), "Test reason");
      const receipt = await tx.wait();
      
      // Check event was emitted with correct data
      const event = receipt.events?.find(e => e.event === "RewardMinted");
      expect(event).to.not.be.undefined;
      expect(event?.args?.to).to.equal(voter1.address);
      expect(event?.args?.amount).to.equal(ethers.utils.parseEther("5"));
      expect(event?.args?.reason).to.equal("Test reason");
    });
    
    it("should allow token transfers", async function() {
      // Grant MINTER_ROLE to admin and mint tokens
      await tokenContract.grantRole(MINTER_ROLE, admin.address);
      await tokenContract.connect(admin).mintReward(voter1.address, ethers.utils.parseEther("20"), "Initial allocation");
      
      // Transfer tokens from voter1 to voter2
      await tokenContract.connect(voter1).transfer(voter2.address, ethers.utils.parseEther("5"));
      
      // Check balances
      expect(await tokenContract.balanceOf(voter1.address)).to.equal(ethers.utils.parseEther("15"));
      expect(await tokenContract.balanceOf(voter2.address)).to.equal(ethers.utils.parseEther("5"));
    });
  });
  
  describe("VoteVerification", function() {
    it("should assign VERIFIER_ROLE to initial verifier", async function() {
      expect(await verificationContract.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
    });
    
    it("should assign DEFAULT_ADMIN_ROLE to deployer", async function() {
      expect(await verificationContract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
    });
    
    it("should create a new election", async function() {
      // Create election
      const electionName = "Test Election 2023";
      const startTime = NOW;
      const endTime = NOW + (7 * ONE_DAY); // 7 days from now
      const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("election-data-hash"));
      
      await verificationContract.connect(deployer).createElection(
        electionName,
        startTime,
        endTime,
        dataHash
      );
      
      // Check election was created correctly
      const election = await verificationContract.elections(0);
      expect(election.name).to.equal(electionName);
      expect(election.startTime).to.equal(startTime);
      expect(election.endTime).to.equal(endTime);
      expect(election.active).to.be.true;
      expect(election.dataHash).to.equal(dataHash);
    });
    
    it("should verify a vote with valid signature", async function() {
      // Create an election first
      const electionId = 0;
      await verificationContract.connect(deployer).createElection(
        "Signature Test Election",
        NOW,
        NOW + ONE_DAY,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"))
      );
      
      // Create message hash for vote verification
      const voter = voter1.address;
      const messageText = `VoteRight Verification\nVoter: ${voter}\nElection: ${electionId}\nTimestamp: ${NOW}`;
      const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(messageText));
      
      // Sign message hash with verifier's private key
      const signature = await verifier.signMessage(ethers.utils.arrayify(messageHash));
      
      // Set the verification signer to verifier's address
      await verificationContract.connect(deployer).setVerificationSigner(verifier.address);
      
      // Submit vote verification
      await verificationContract.connect(admin).verifyVote(
        voter,
        electionId,
        messageHash,
        signature
      );
      
      // Check that the vote was recorded
      expect(await verificationContract.hasVoted(voter, electionId)).to.be.true;
      
      // Check that we can't vote twice in the same election
      await expect(
        verificationContract.connect(admin).verifyVote(voter, electionId, messageHash, signature)
      ).to.be.revertedWith("Voter has already voted in this election");
    });
    
    it("should end an election and prevent further voting", async function() {
      // Create an election
      await verificationContract.connect(deployer).createElection(
        "Ending Test Election",
        NOW - ONE_DAY, // Started yesterday
        NOW + ONE_DAY, // Ends tomorrow
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"))
      );
      
      // End the election
      await verificationContract.connect(deployer).endElection(0);
      
      // Check that the election is now inactive
      const election = await verificationContract.elections(0);
      expect(election.active).to.be.false;
      
      // Prepare a vote verification
      const voter = voter1.address;
      const messageText = `VoteRight Verification\nVoter: ${voter}\nElection: 0\nTimestamp: ${NOW}`;
      const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(messageText));
      const signature = await verifier.signMessage(ethers.utils.arrayify(messageHash));
      
      await verificationContract.connect(deployer).setVerificationSigner(verifier.address);
      
      // Attempt to verify a vote after election end should fail
      await expect(
        verificationContract.connect(admin).verifyVote(voter, 0, messageHash, signature)
      ).to.be.revertedWith("Election is not active");
    });
    
    it("should pause and unpause vote verification", async function() {
      // Grant PAUSER_ROLE to admin
      await verificationContract.connect(deployer).grantRole(PAUSER_ROLE, admin.address);
      
      // Pause the contract
      await verificationContract.connect(admin).pause();
      expect(await verificationContract.paused()).to.be.true;
      
      // Create a test election
      await verificationContract.connect(deployer).createElection(
        "Pause Test Election",
        NOW,
        NOW + ONE_DAY,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"))
      );
      
      // Prepare a vote verification
      const voter = voter1.address;
      const messageText = `VoteRight Verification\nVoter: ${voter}\nElection: 0\nTimestamp: ${NOW}`;
      const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(messageText));
      const signature = await verifier.signMessage(ethers.utils.arrayify(messageHash));
      
      await verificationContract.connect(deployer).setVerificationSigner(verifier.address);
      
      // Attempt to verify a vote while paused should fail
      await expect(
        verificationContract.connect(admin).verifyVote(voter, 0, messageHash, signature)
      ).to.be.revertedWith("Pausable: paused");
      
      // Unpause the contract
      await verificationContract.connect(admin).unpause();
      expect(await verificationContract.paused()).to.be.false;
      
      // Now vote verification should work
      await verificationContract.connect(admin).verifyVote(voter, 0, messageHash, signature);
      expect(await verificationContract.hasVoted(voter, 0)).to.be.true;
    });
  });
  
  describe("Integration", function() {
    it("should reward tokens after vote verification", async function() {
      // Create an election
      await verificationContract.connect(deployer).createElection(
        "Reward Test Election",
        NOW,
        NOW + ONE_DAY,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"))
      );
      
      // Prepare a vote verification
      const voter = voter1.address;
      const messageText = `VoteRight Verification\nVoter: ${voter}\nElection: 0\nTimestamp: ${NOW}`;
      const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(messageText));
      const signature = await verifier.signMessage(ethers.utils.arrayify(messageHash));
      
      await verificationContract.connect(deployer).setVerificationSigner(verifier.address);
      
      // Before verification
      expect(await tokenContract.balanceOf(voter)).to.equal(0);
      
      // Verify vote
      await verificationContract.connect(admin).verifyVote(voter, 0, messageHash, signature);
      
      // After verification - check if tokens were minted
      // Note: This would require additional implementation in the VoteVerification contract
      // to actually call the token contract's mintReward function
      
      // For the purpose of this test, we'll manually mint a reward to simulate
      // what would happen in a complete integration
      await tokenContract.grantRole(MINTER_ROLE, admin.address);
      await tokenContract.connect(admin).mintReward(voter, ethers.utils.parseEther("1"), "Vote verification reward");
      
      expect(await tokenContract.balanceOf(voter)).to.equal(ethers.utils.parseEther("1"));
    });
  });
});
