import { useEffect, useCallback } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { getBalance } from '../services/ton';
import { BALANCE_POLL_INTERVAL_MS } from '../constants/config';

/**
 * Hook that polls the wallet balance at a regular interval.
 */
export function useBalance() {
  const keys = useWalletStore((s) => s.keys);
  const setBalance = useWalletStore((s) => s.setBalance);
  const setLoading = useWalletStore((s) => s.setLoading);

  const fetchBalance = useCallback(async () => {
    if (!keys) return;
    setLoading('balance', true);
    try {
      const balance = await getBalance(keys.publicKey);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading('balance', false);
    }
  }, [keys, setBalance, setLoading]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, BALANCE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { refetch: fetchBalance };
}
