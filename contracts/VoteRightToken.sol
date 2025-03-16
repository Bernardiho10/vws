// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title VoteRightToken
 * @dev ERC20 token for the VoteRight platform with role-based permissions
 */
contract VoteRightToken is ERC20, ERC20Burnable, AccessControl {
    // Create role identifiers
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    // Events
    event RewardDistributed(address indexed to, uint256 amount, string reason);
    
    // Maximum supply cap
    uint256 public immutable maxSupply;
    
    /**
     * @dev Constructor that sets up roles and mints initial supply to admin
     * @param initialSupply The initial amount to mint
     * @param maxTokenSupply The maximum total supply allowed
     */
    constructor(uint256 initialSupply, uint256 maxTokenSupply) 
        ERC20("VoteRight Token", "VOTE") 
    {
        require(maxTokenSupply >= initialSupply, "Max supply must be >= initial supply");
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
        
        // Set max supply
        maxSupply = maxTokenSupply;
        
        // Mint initial supply
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Function to mint tokens with reason tracking
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     * @param reason The reason for minting (for event logging)
     */
    function mintReward(address to, uint256 amount, string memory reason) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(totalSupply() + amount <= maxSupply, "Exceeds max token supply");
        _mint(to, amount);
        emit RewardDistributed(to, amount, reason);
    }
    
    /**
     * @dev Override to make token transfers pausable by governance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
    }
}
