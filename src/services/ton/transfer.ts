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

/**
 * Wait for a transaction to confirm by polling seqno.
 */
export async function waitForTransaction(
  publicKey: Uint8Array,
  previousSeqno: number,
  timeoutMs: number = 60_000,
): Promise<boolean> {
  const client = await getTonClient();
  const wallet = createWalletContract(publicKey);
  const contract = client.open(wallet);

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const currentSeqno = await contract.getSeqno();
    if (currentSeqno > previousSeqno) return true;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  return false;
}
