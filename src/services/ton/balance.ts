import { getTonClient } from './client';
import { createWalletContract } from './wallet';

const BALANCE_CACHE_KEY = 'ton_wallet_balance_cache';

function cacheBalance(address: string, balance: bigint) {
  try {
    localStorage.setItem(BALANCE_CACHE_KEY, JSON.stringify({
      address,
      balance: balance.toString(),
      updatedAt: Date.now(),
    }));
  } catch {}
}

export function getCachedBalance(address: string): bigint | null {
  try {
    const raw = localStorage.getItem(BALANCE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.address !== address) return null;
    return BigInt(cached.balance);
  } catch {
    return null;
  }
}

/**
 * Fetch the wallet balance in nanoTON. Caches on success, returns cache on network error.
 */
export async function getBalance(publicKey: Uint8Array): Promise<bigint> {
  const client = await getTonClient();
  const wallet = createWalletContract(publicKey);
  const contract = client.open(wallet);
  const address = wallet.address.toString({ bounceable: false, testOnly: true });

  try {
    const balance = await contract.getBalance();
    cacheBalance(address, balance);
    return balance;
  } catch {
    const cached = getCachedBalance(address);
    if (cached !== null) return cached;
    throw new Error('Network error and no cached balance available');
  }
}

/**
 * Format nanoTON to human-readable TON string.
 */
export function formatTon(nanoTon: bigint): string {
  const whole = nanoTon / 1_000_000_000n;
  const frac = nanoTon % 1_000_000_000n;
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

/**
 * Parse a TON amount string to nanoTON.
 */
export function toNanoTon(ton: string): bigint {
  const [whole, frac = ''] = ton.split('.');
  const fracPadded = frac.padEnd(9, '0').slice(0, 9);
  return BigInt(whole) * 1_000_000_000n + BigInt(fracPadded);
}
