import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/web3-context';
import { Button } from '@/components/ui/button';
import { ethers } from 'ethers';
import { AssetTransfersCategory } from 'alchemy-sdk';

interface Transaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

export function TransactionManager() {
  const { provider, account } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTransactions = async () => {
    if (!provider || !account) return;

    setIsLoading(true);
    try {
      const history = await provider.core.getAssetTransfers({
        fromAddress: account,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
      });

      const formattedTxs = history.transfers.map((tx) => ({
        hash: tx.hash,
        status: 'confirmed' as const,
        timestamp: Math.floor(new Date(tx.blockNum).getTime() / 1000),
      }));

      setTransactions(formattedTxs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [provider, account]);

  if (!account) {
    return <div>Please connect your wallet to view transactions.</div>;
  }

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTransactions}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-gray-500">No transactions found</div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.hash}
              className="p-4 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
                <div
                  className={`px-2 py-1 text-sm rounded ${
                    tx.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : tx.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tx.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 