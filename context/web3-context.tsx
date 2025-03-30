import { createContext, useContext, useEffect, useState } from 'react';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from 'ethers';

interface Web3ContextType {
  provider: Alchemy | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  account: null,
  chainId: null,
  isConnected: false,
  balance: null,
  connect: async () => {},
  disconnect: async () => {},
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Alchemy | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    const initAlchemy = () => {
      const settings = {
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: Network.ETH_SEPOLIA,
      };
      const alchemy = new Alchemy(settings);
      setProvider(alchemy);
    };

    initAlchemy();
  }, []);

  useEffect(() => {
    if (account && provider) {
      updateBalance();
    }
  }, [account, provider]);

  const updateBalance = async () => {
    if (!account || !provider) return;
    try {
      const balance = await provider.core.getBalance(account);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connect = async () => {
    if (!provider) return;
    try {
      const [selectedAccount] = await window?.ethereum?.request({
        method: 'eth_requestAccounts',
      });
      const chainId = await window?.ethereum?.request({
        method: 'eth_chainId',
      });
      
      setAccount(selectedAccount);
      setChainId(parseInt(chainId, 16));

      window?.ethereum?.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });

      window?.ethereum?.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnect = async () => {
    setAccount(null);
    setChainId(null);
    setBalance(null);
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        account,
        chainId,
        isConnected: !!account,
        balance,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context); 