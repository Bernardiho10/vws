'use client'

// Import only the types we need
import { NFTMetadata, SupportBadge, MintStatus } from "./types";
import { storeOnIPFS } from '@/services/ipfs'

/**
 * Configuration for NFT operations
 */
interface NFTConfig {
  readonly contractAddress: string;
  readonly chainId: number;
}

/**
 * Default NFT configuration for the application
 */
export const DEFAULT_NFT_CONFIG: NFTConfig = {
  contractAddress: "0x0000000000000000000000000000000000000000", // Will be updated once contract is deployed
  chainId: 80001, // Polygon Mumbai
} as const;

/**
 * Creates NFT metadata from image and details
 */
export function createNFTMetadata(
  imageData: string,
  caption: string,
  location: string,
): NFTMetadata {
  const timestamp = Date.now();
  const attributes = [
    {
      trait_type: "Type",
      value: "Vote Support Badge",
    },
    {
      trait_type: "Location",
      value: location,
    },
    {
      trait_type: "Created",
      value: timestamp,
    },
  ];

  return {
    name: `Vote With Sense Support Badge`,
    description: caption || "Show your support for the campaign. #VoteWithSense",
    image: imageData,
    attributes,
  };
}

/**
 * Uploads NFT metadata to IPFS
 */
export async function uploadMetadata(
  metadataToUpload: NFTMetadata
): Promise<string> {
  try {
    // Convert metadata to JSON string and then to Uint8Array
    const jsonString = JSON.stringify(metadataToUpload)
    const data = new TextEncoder().encode(jsonString)
    
    // Upload to IPFS using Helia
    const cid = await storeOnIPFS(data)
    
    // Return IPFS URI
    return `ipfs://${cid}`
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error)
    throw new Error('Failed to upload metadata to IPFS')
  }
}

/**
 * Creates a support badge from image data
 */
export function createSupportBadge(
  imageUrl: string,
  owner: string = "",
  caption: string = "",
  location: string = ""
): SupportBadge {
  // Use the MintStatus type for type safety
  const initialStatus: MintStatus = "not_minted";
  
  return {
    id: `badge_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    tokenId: null,
    imageUrl,
    owner,
    caption,
    location,
    createdAt: Date.now(),
    mintStatus: initialStatus,
  };
}

/**
 * Mint an NFT (simulated for now)
 */
export async function mintNFT(
  badge: SupportBadge,
  address: string
): Promise<SupportBadge> {
  // This would connect to the actual smart contract in production
  
  // Create updated badge with pending status
  const pendingStatus: MintStatus = "pending";
  const mintedStatus: MintStatus = "minted";
  
  const pendingBadge: SupportBadge = {
    ...badge,
    owner: address,
    mintStatus: pendingStatus,
  };

  // Simulate minting process with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const mintedBadge: SupportBadge = {
        ...pendingBadge,
        tokenId: Math.floor(Math.random() * 10000),
        mintStatus: mintedStatus,
      };
      resolve(mintedBadge);
    }, 3000);
  });
}
