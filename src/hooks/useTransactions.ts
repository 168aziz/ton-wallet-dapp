import { useEffect, useCallback } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { getTransactions } from '../services/ton';

/**
 * Hook that fetches and manages transaction history.
 */
export function useTransactions() {
  const keys = useWalletStore((s) => s.keys);
  const setTransactions = useWalletStore((s) => s.setTransactions);
  const setLoading = useWalletStore((s) => s.setLoading);

  const fetchTransactions = useCallback(async () => {
    if (!keys) return;
    setLoading('transactions', true);
    try {
      const txs = await getTransactions(keys.publicKey);
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading('transactions', false);
    }
  }, [keys, setTransactions, setLoading]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { refetch: fetchTransactions };
}
