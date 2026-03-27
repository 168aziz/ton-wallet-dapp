import { internal, toNano } from '@ton/ton';
import { Address } from '@ton/core';
import { getTonClient } from './client';
import { createWalletContract } from './wallet';
import type { WalletKeys } from '../../types';

export interface TransferParams {
  keys: WalletKeys;
  to: string;
  amount: string;
  comment?: string;
}

/**
 * Send TON to a recipient address.
 * Returns the sequence number used (for tracking).
 */
export async function sendTransfer(params: TransferParams): Promise<number> {
  const { keys, to, amount, comment } = params;

  const client = await getTonClient();
  const wallet = createWalletContract(keys.publicKey);
  const contract = client.open(wallet);

  const seqno = await contract.getSeqno();

  await contract.sendTransfer({
    seqno,
    secretKey: Buffer.from(keys.secretKey),
    messages: [
      internal({
        to: Address.parse(to),
        value: toNano(amount),
        bounce: false,
        body: comment ?? undefined,
      }),
    ],
  });

  return seqno;
}

export type ConfirmationResult = 'confirmed' | 'timeout' | 'network-error';

/**
 * Wait for a transaction to confirm by polling seqno.
 * Retries on network errors (502, timeouts) instead of throwing.
 */
export async function waitForTransaction(
  publicKey: Uint8Array,
  previousSeqno: number,
  timeoutMs: number = 60_000,
): Promise<ConfirmationResult> {
  const client = await getTonClient();
  const wallet = createWalletContract(publicKey);
  const contract = client.open(wallet);

  const startTime = Date.now();
  let consecutiveErrors = 0;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const currentSeqno = await contract.getSeqno();
      consecutiveErrors = 0;
      if (currentSeqno > previousSeqno) return 'confirmed';
    } catch {
      consecutiveErrors++;
      if (consecutiveErrors >= 10) return 'network-error';
    }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  return 'timeout';
}
