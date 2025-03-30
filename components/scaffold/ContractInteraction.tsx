import { useScaffoldContract } from '@/hooks/useScaffoldContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ethers, ContractTransaction } from 'ethers';

interface ContractInteractionProps {
  contractAddress: string;
  contractABI: any[];
}

interface TransactionResult {
  hash: string;
  wait: () => Promise<ethers.ContractReceipt>;
}

export function ContractInteraction({
  contractAddress,
  contractABI,
}: ContractInteractionProps) {
  const { contract, error, read, write } = useScaffoldContract({
    address: contractAddress,
    abi: contractABI,
  });

  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRead = async (method: string) => {
    setIsLoading(true);
    try {
      const result = await read<string>(method);
      setResult(result);
    } catch (error) {
      console.error('Error reading from contract:', error);
      setResult('Error: Failed to read from contract');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWrite = async (method: string) => {
    setIsLoading(true);
    try {
      const tx = await write<TransactionResult>(method, [inputValue]);
      setResult(`Transaction hash: ${tx.hash}`);
    } catch (error) {
      console.error('Error writing to contract:', error);
      setResult('Error: Failed to write to contract');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  if (!contract) {
    return <div>Loading contract...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter value..."
        />
        <Button
          onClick={() => handleWrite('setValue')}
          disabled={isLoading}
        >
          Set Value
        </Button>
        <Button
          variant="outline"
          onClick={() => handleRead('getValue')}
          disabled={isLoading}
        >
          Get Value
        </Button>
      </div>

      {result && (
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-medium">Result:</h3>
          <pre className="mt-2 text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
} 