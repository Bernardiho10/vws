import { useEffect, useState } from 'react';
import { Alchemy, Network, AlchemySettings } from 'alchemy-sdk';

export function useAlchemyProvider(network: Network = Network.ETH_SEPOLIA) {
  const [provider, setProvider] = useState<Alchemy | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initProvider = () => {
      try {
        const settings: AlchemySettings = {
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
          network,
        };

        const alchemy = new Alchemy(settings);
        setProvider(alchemy);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize Alchemy provider'));
        setProvider(null);
      }
    };

    initProvider();
  }, [network]);

  return { provider, error };
} 