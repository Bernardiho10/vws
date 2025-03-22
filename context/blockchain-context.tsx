"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { WalletState } from "@/utils/blockchain/types";
import { availableChains, DEFAULT_CHAIN } from "@/lib/blockchain/config";

/**
 * Shape of the blockchain context
 */
interface BlockchainContextType {
  readonly walletState: WalletState;
  readonly connectWallet: () => Promise<void>;
  readonly disconnectWallet: () => void;
  readonly switchToDefaultNetwork: () => Promise<void>;
  readonly isSupportedChain: (chainId: number | null) => boolean;
  readonly formatAddress: (address: string | null) => string;
}

/**
 * Default wallet state
 */
const defaultWalletState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  isConnecting: false,
  error: null,
  isReconnecting: false,
};

/**
 * Create blockchain context
 */
const BlockchainContext = createContext<BlockchainContextType>({
  walletState: defaultWalletState,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToDefaultNetwork: async () => {},
  isSupportedChain: () => false,
  formatAddress: () => "",
});

/**
 * Blockchain Provider Props
 */
interface BlockchainProviderProps {
  readonly children: React.ReactNode;
}

/**
 * Blockchain context provider component
 */
export function BlockchainProvider({ children }: BlockchainProviderProps): React.ReactElement {
  // Wagmi hooks
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  // Local state - initialize with values from hooks to avoid unnecessary renders
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: isConnected || false,
    address: address || null,
    chainId: chainId || null,
    isConnecting: isConnecting || false,
    error: null,
    isReconnecting: isReconnecting || false,
  });
  
  const [error, setError] = useState<Error | null>(null);

  /**
   * Connect wallet using Injected connector
   */
  const connectWallet = useCallback(async (): Promise<void> => {
    try {
      const result = await connectAsync({ 
        connector: injected()
      });
      console.log("Wallet connected", result);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(err instanceof Error ? err : new Error("Failed to connect wallet"));
    }
  }, [connectAsync]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback((): void => {
    disconnectAsync()
      .then(() => console.log("Wallet disconnected"))
      .catch((err) => {
        console.error("Error disconnecting wallet:", err);
        setError(err instanceof Error ? err : new Error("Failed to disconnect wallet"));
      });
  }, [disconnectAsync]);

  /**
   * Switch to default network
   */
  const switchToDefaultNetwork = useCallback(async (): Promise<void> => {
    if (!switchChainAsync) return;
    
    try {
      await switchChainAsync({ chainId: DEFAULT_CHAIN.id });
    } catch (err) {
      console.error("Error switching network:", err);
      setError(err instanceof Error ? err : new Error("Failed to switch network"));
    }
  }, [switchChainAsync]);

  /**
   * Check if chain is supported
   */
  const isSupportedChain = useCallback((chainId: number | null): boolean => {
    if (!chainId) return false;
    return availableChains.some((c) => c.id === chainId);
  }, []);

  /**
   * Format address for display
   */
  const formatAddress = useCallback((address: string | null): string => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Update wallet state when account or chain changes
  useEffect(() => {
    // Only update if any values have actually changed
    const newState = {
      isConnected,
      address: address || null,
      chainId: chainId || null,
      isConnecting,
      error,
      isReconnecting,
    };
    
    // Compare with current state to avoid unnecessary updates
    if (
      walletState.isConnected !== newState.isConnected ||
      walletState.address !== newState.address ||
      walletState.chainId !== newState.chainId ||
      walletState.isConnecting !== newState.isConnecting ||
      walletState.error !== newState.error ||
      walletState.isReconnecting !== newState.isReconnecting
    ) {
      setWalletState(newState);
    }
  }, [address, chainId, error, isConnected, isConnecting, isReconnecting, walletState]);

  const contextValue = {
    walletState,
    connectWallet,
    disconnectWallet,
    switchToDefaultNetwork,
    isSupportedChain,
    formatAddress,
  };

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
}

/**
 * Custom hook to use blockchain context
 */
export function useBlockchain(): BlockchainContextType {
  const context = useContext(BlockchainContext);
  
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  
  return context;
}