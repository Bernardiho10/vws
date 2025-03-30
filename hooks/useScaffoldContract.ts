import { useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { useWeb3 } from '@/context/web3-context';
import { Alchemy } from 'alchemy-sdk';

interface ContractConfig {
  address: string;
  abi: any[];
}

export function useScaffoldContract<T extends Contract = Contract>(config: ContractConfig) {
  const { provider } = useWeb3();
  const [contract, setContract] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initContract = async () => {
      if (!provider || !config.address || !config.abi) {
        setContract(null);
        return;
      }

      try {
        // Get ethers provider from Alchemy
        const ethersProvider = new ethers.providers.JsonRpcProvider(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        );
        
        // Create a signer
        const signer = ethersProvider.getSigner();
        
        // Create contract instance
        const contractInstance = new ethers.Contract(
          config.address,
          config.abi,
          signer
        ) as T;

        setContract(contractInstance);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize contract'));
        setContract(null);
      }
    };

    initContract();
  }, [provider, config.address, config.abi]);

  const read = async <R>(
    method: keyof T,
    args: any[] = []
  ): Promise<R> => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await (contract[method] as any)(...args);
      return result as R;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Contract read failed');
    }
  };

  const write = async <R>(
    method: keyof T,
    args: any[] = [],
    overrides: ethers.PayableOverrides = {}
  ): Promise<R> => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await (contract[method] as any)(...args, overrides);
      const receipt = await tx.wait();
      return receipt as R;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Contract write failed');
    }
  };

  return {
    contract,
    error,
    read,
    write,
  };
} 