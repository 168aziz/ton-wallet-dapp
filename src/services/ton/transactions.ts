import { Address } from '@ton/core';
import { getTonClient } from './client';
import { createWalletContract } from './wallet';
import type { ParsedTransaction } from '../../types';
import { TX_PAGE_SIZE } from '../../constants/config';

/**
 * Fetch and parse recent transactions for the wallet.
 */
export async function getTransactions(
  publicKey: Uint8Array,
  limit: number = TX_PAGE_SIZE,
): Promise<ParsedTransaction[]> {
  const client = await getTonClient();
  const wallet = createWalletContract(publicKey);
  const address = wallet.address;

  const rawTxs = await client.getTransactions(address, { limit });

  return rawTxs.map((tx) => parseTx(tx, address)).filter(Boolean) as ParsedTransaction[];
}

function parseTx(tx: any, _walletAddress: Address): ParsedTransaction | null {
  const timestamp = tx.now;
  const hash = tx.hash().toString('hex');
  const lt = tx.lt.toString();
  const fee = tx.totalFees.coins;

  // Incoming transaction
  const inMsg = tx.inMessage;
  if (inMsg?.info.type === 'internal') {
    const sender = inMsg.info.src;
    const amount = inMsg.info.value.coins;

    return {
      hash,
      lt,
      timestamp,
      direction: 'in',
      amount,
      address: sender?.toString({ bounceable: false, testOnly: true }) ?? 'unknown',
      comment: parseComment(inMsg.body),
      fee,
    };
  }

  // Outgoing transaction(s)
  const outMsgs = tx.outMessages;
  if (outMsgs.size > 0) {
    const firstOut = outMsgs.values()[0];
    if (firstOut?.info.type === 'internal') {
      const dest = firstOut.info.dest;
      const amount = firstOut.info.value.coins;

      return {
        hash,
        lt,
        timestamp,
        direction: 'out',
        amount,
        address: dest?.toString({ bounceable: false, testOnly: true }) ?? 'unknown',
        comment: parseComment(firstOut.body),
        fee,
      };
    }
  }

  return null;
}

function parseComment(body: any): string | undefined {
  try {
    if (!body) return undefined;
    const slice = body.beginParse();
    if (slice.remainingBits < 32) return undefined;
    const op = slice.loadUint(32);
    if (op !== 0) return undefined;
    return slice.loadStringTail();
  } catch {
    return undefined;
  }
}
