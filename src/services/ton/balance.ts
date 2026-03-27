import { getTonClient } from './client';
import { createWalletContract } from './wallet';

/**
 * Fetch the wallet balance in nanoTON.
 */
export async function getBalance(publicKey: Uint8Array): Promise<bigint> {
  const client = await getTonClient();
  const wallet = createWalletContract(publicKey);
  const contract = client.open(wallet);
  return contract.getBalance();
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
