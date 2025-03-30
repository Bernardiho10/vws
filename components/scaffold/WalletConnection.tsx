import { useWeb3 } from '@/context/web3-context';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export function WalletConnection() {
  const { connect, disconnect, account, isConnected, balance } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          {balance && (
            <span className="text-xs text-gray-500">
              {parseFloat(balance).toFixed(4)} ETH
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={isLoading}
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
} 