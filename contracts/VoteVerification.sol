// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title VoteVerification
 * @dev Contract for verifying voter participation without revealing ballot choices
 */
contract VoteVerification is AccessControl, Pausable {
    using ECDSA for bytes32;

    // Role definitions
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Events
    event VoteVerified(bytes32 indexed voteId, address indexed voter, uint256 electionId, uint256 timestamp);
    event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    event ElectionEnded(uint256 indexed electionId, uint256 totalVerifiedVotes);
    
    // Structures
    struct Election {
        string name;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 verifiedVotes;
        bytes32 dataHash; // Hash of election metadata
    }
    
    struct VoteRecord {
        address voter;
        uint256 timestamp;
        bytes32 proofHash; // Hash of proof without revealing vote choices
    }
    
    // State variables
    mapping(uint256 => Election) public elections;
    mapping(bytes32 => VoteRecord) public voteRecords;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    
    uint256 public electionCounter;
    address public verificationSigner;
    
    /**
     * @dev Constructor sets up roles and initial verifier
     * @param initialVerifier The address that will have verification rights
     */
    constructor(address initialVerifier) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, initialVerifier);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        verificationSigner = initialVerifier;
    }
    
    /**
     * @dev Create a new election
     * @param name Name of the election
     * @param startTime Start timestamp for the election
     * @param endTime End timestamp for the election
     * @param dataHash Hash of the election metadata (stored off-chain)
     */
    function createElection(
        string memory name,
        uint256 startTime,
        uint256 endTime,
        bytes32 dataHash
    ) external onlyRole(VERIFIER_ROLE) {
        require(startTime < endTime, "Start time must be before end time");
        require(endTime > block.timestamp, "End time must be in the future");
        
        uint256 electionId = electionCounter++;
        
        elections[electionId] = Election({
            name: name,
            startTime: startTime,
            endTime: endTime,
            active: true,
            verifiedVotes: 0,
            dataHash: dataHash
        });
        
        emit ElectionCreated(electionId, name, startTime, endTime);
    }
    
    /**
     * @dev End an active election
     * @param electionId ID of the election to end
     */
    function endElection(uint256 electionId) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        require(elections[electionId].active, "Election not active");
        
        elections[electionId].active = false;
        
        emit ElectionEnded(electionId, elections[electionId].verifiedVotes);
    }
    
    /**
     * @dev Verify a vote using cryptographic proof
     * @param voter Address of the voter
     * @param electionId ID of the election
     * @param proofHash Hash representing proof of voting without revealing choices
     * @param signature Cryptographic signature from authorized verifier
     */
    function verifyVote(
        address voter,
        uint256 electionId,
        bytes32 proofHash,
        bytes memory signature
    ) 
        external
        whenNotPaused 
    {
        // Verify signature from authorized signer
        bytes32 messageHash = keccak256(abi.encodePacked(voter, electionId, proofHash));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        require(signer == verificationSigner, "Invalid signature");
        require(elections[electionId].active, "Election not active");
        require(block.timestamp >= elections[electionId].startTime, "Election not started");
        require(block.timestamp <= elections[electionId].endTime, "Election ended");
        require(!hasVoted[voter][electionId], "Already voted in this election");
        
        // Create unique vote ID
        bytes32 voteId = keccak256(abi.encodePacked(voter, electionId, block.timestamp));
        
        // Record the vote verification
        voteRecords[voteId] = VoteRecord({
            voter: voter,
            timestamp: block.timestamp,
            proofHash: proofHash
        });
        
        // Mark voter as having voted in this election
        hasVoted[voter][electionId] = true;
        
        // Increment verified vote count
        elections[electionId].verifiedVotes++;
        
        emit VoteVerified(voteId, voter, electionId, block.timestamp);
    }
    
    /**
     * @dev Set a new verification signer
     * @param newSigner Address of the new signer
     */
    function setVerificationSigner(address newSigner) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newSigner != address(0), "Invalid signer address");
        verificationSigner = newSigner;
    }
    
    /**
     * @dev Pause vote verification
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause vote verification
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
