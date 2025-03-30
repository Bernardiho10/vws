import React from 'react';
import { useWeb3 } from '@/context/web3-context';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { useScaffoldContract } from '@/hooks/useScaffoldContract';

interface MintBadgeButtonProps {
  onSuccess?: () => void;
  imageHash?: string;
  disabled?: boolean;
}

const BADGE_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "mintBadge",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export function MintBadgeButton({ onSuccess, imageHash, disabled }: MintBadgeButtonProps) {
  const { account } = useWeb3();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Replace with your actual badge contract address
  const badgeContractAddress = process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS || '';

  const { write } = useScaffoldContract({
    address: badgeContractAddress,
    abi: BADGE_ABI,
  });

  const handleMint = async () => {
    if (!account || !imageHash) return;

    setIsLoading(true);
    setError(null);

    try {
      const tokenURI = `ipfs://${imageHash}`;
      await write('mintBadge', [tokenURI]);
      onSuccess?.();
    } catch (err) {
      console.error('Error minting badge:', err);
      setError('Failed to mint badge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Award className="mr-2 h-4 w-4" />
        Connect Wallet to Mint
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={handleMint}
        disabled={disabled || isLoading || !imageHash}
        className="w-full"
      >
        <Award className="mr-2 h-4 w-4" />
        {isLoading ? 'Minting...' : 'Mint as NFT Badge'}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
} 