import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { VerificationData } from '@/components/verification/FacialVerification'
import { storeOnIPFS } from './ipfs'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      isConnected: () => boolean;
    };
  }
}

// Alchemy configuration
const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(settings);

// Smart contract ABI and address
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_imageHash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_faceDetected",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "_confidence",
        "type": "uint256"
      }
    ],
    "name": "storeVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_voter",
        "type": "address"
      }
    ],
    "name": "invalidateVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_voter",
        "type": "address"
      }
    ],
    "name": "isVerified",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_voter",
        "type": "address"
      }
    ],
    "name": "getVerification",
    "outputs": [
      {
        "internalType": "string",
        "name": "imageHash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "faceDetected",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "confidence",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
if (!CONTRACT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set. Please set it in your .env.local file.');
}

// Initialize ethers contract
let provider: ethers.providers.Web3Provider;
let contract: ethers.Contract;

// Initialize provider and contract only in browser environment
if (typeof window !== 'undefined' && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function storeImageOnIPFS(imageData: string): Promise<string> {
  try {
    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = new Uint8Array(Buffer.from(base64Data, 'base64'))

    // Add the image to IPFS using Helia
    return await storeOnIPFS(buffer)
  } catch (error) {
    console.error('Error storing image on IPFS:', error)
    throw new Error('Failed to store image on IPFS')
  }
}

export async function storeVerificationData(
  verificationData: VerificationData,
  ipfsHash: string
): Promise<string> {
  try {
    if (!provider || !contract) {
      throw new Error('Provider or contract not initialized');
    }

    // Get signer from provider
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    // Convert confidence to integer (multiply by 100 to preserve 2 decimal places)
    const confidenceInt = Math.floor(verificationData.confidence * 100)

    // Store verification data on blockchain
    const tx = await contractWithSigner.storeVerification(
      ipfsHash,
      verificationData.timestamp,
      verificationData.faceDetected,
      confidenceInt
    );

    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error('Error storing verification data on blockchain:', error)
    throw new Error('Failed to store verification data on blockchain')
  }
}

export async function checkVerificationStatus(address: string): Promise<boolean> {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    return await contract.isVerified(address);
  } catch (error) {
    console.error('Error checking verification status:', error)
    throw new Error('Failed to check verification status')
  }
}

interface VerificationResult {
  imageHash: string
  timestamp: string
  faceDetected: boolean
  confidence: string
  isValid: boolean
}

export async function getVerificationDetails(address: string): Promise<{
  imageHash: string
  timestamp: number
  faceDetected: boolean
  confidence: number
  isValid: boolean
}> {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    const result = await contract.getVerification(address) as VerificationResult
    return {
      imageHash: result.imageHash,
      timestamp: Number(result.timestamp),
      faceDetected: result.faceDetected,
      confidence: Number(result.confidence) / 100, // Convert back to decimal
      isValid: result.isValid
    }
  } catch (error) {
    console.error('Error getting verification details:', error)
    throw new Error('Failed to get verification details')
  }
}

export async function invalidateVerification(address: string): Promise<void> {
  try {
    if (!provider || !contract) {
      throw new Error('Provider or contract not initialized');
    }
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.invalidateVerification(address);
    await tx.wait();
  } catch (error) {
    console.error('Error invalidating verification:', error)
    throw new Error('Failed to invalidate verification')
  }
}

export async function verifyUserIdentity(
  imageData: string,
  verificationData: VerificationData
): Promise<{ ipfsHash: string; transactionHash: string }> {
  try {
    // First store the image on IPFS
    const ipfsHash = await storeImageOnIPFS(imageData);

    // Then store the verification data on the blockchain
    const transactionHash = await storeVerificationData(verificationData, ipfsHash);

    return { ipfsHash, transactionHash };
  } catch (error) {
    console.error('Error in user identity verification:', error);
    throw new Error('Failed to verify user identity');
  }
} 