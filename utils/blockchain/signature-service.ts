/**
 * Signature-related utilities for the VoteRight platform
 */
import { VerificationProof } from "@/types/blockchain";
import { hashMessage, recoverMessageAddress, stringToHex } from "viem";

/**
 * Parameters for generating a proof hash
 */
interface ProofDataParams {
  readonly voterAddress: string;
  readonly electionId: number;
  readonly voteTimestamp: number;
  readonly verificationImageHash?: string;
}

/**
 * Parameters for verifying a signature
 */
interface VerifySignatureParams {
  readonly message: string;
  readonly signature: string;
  readonly expectedSigner: string;
}

/**
 * Service for handling cryptographic signatures and verification
 */
export const signatureService = {
  /**
   * Creates a structured message for signing
   */
  createSignatureMessage: (params: ProofDataParams): string => {
    const { voterAddress, electionId, voteTimestamp, verificationImageHash } = params;
    
    const baseMessage = `VoteRight Verification\nVoter: ${voterAddress}\nElection: ${electionId}\nTimestamp: ${voteTimestamp}`;
    
    if (verificationImageHash) {
      return `${baseMessage}\nImageHash: ${verificationImageHash}`;
    }
    
    return baseMessage;
  },
  
  /**
   * Creates a proof hash from verification data
   */
  createProofHash: (params: ProofDataParams): string => {
    const message = signatureService.createSignatureMessage(params);
    return hashMessage(message);
  },
  
  /**
   * Verifies a signature matches the expected signer
   */
  verifySignature: async (params: VerifySignatureParams): Promise<boolean> => {
    const { message, signature, expectedSigner } = params;
    
    try {
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });
      
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  },
  
  /**
   * Creates a verification proof object ready for submission
   */
  createVerificationProof: (
    voterAddress: string,
    electionId: number,
    voteTimestamp: number,
    signature: string,
    verificationImageHash?: string
  ): VerificationProof => {
    const params: ProofDataParams = {
      voterAddress,
      electionId,
      voteTimestamp,
      verificationImageHash
    };
    
    const proofHash = signatureService.createProofHash(params);
    
    return {
      voter: voterAddress,
      electionId,
      proofHash,
      signature
    };
  },
  
  /**
   * Formats an address for display
   */
  formatAddress: (address: string): string => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },
  
  /**
   * Converts an image to a hash for verification
   */
  imageToHash: async (imageData: string | Blob): Promise<string> => {
    // For blob input
    if (imageData instanceof Blob) {
      const arrayBuffer = await imageData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const hashBuffer = await crypto.subtle.digest('SHA-256', uint8Array);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // For base64 or string input
    return stringToHex(imageData);
  }
};
