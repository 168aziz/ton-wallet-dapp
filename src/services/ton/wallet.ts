import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { WORKCHAIN } from '../../constants/config';
import type { WalletKeys } from '../../types';

/**
 * Generate a new 12-word mnemonic.
 */
export async function generateMnemonic(): Promise<string[]> {
  return mnemonicNew(12);
}

/**
 * Validate a mnemonic phrase.
 */
export async function validateMnemonic(mnemonic: string[]): Promise<boolean> {
  return mnemonicValidate(mnemonic);
}

/**
 * Derive keypair from mnemonic.
 */
export async function deriveKeys(mnemonic: string[]): Promise<WalletKeys> {
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  return {
    mnemonic,
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Create a WalletContractV4 instance from a public key.
 */
export function createWalletContract(publicKey: Buffer | Uint8Array) {
  return WalletContractV4.create({
    workchain: WORKCHAIN,
    publicKey: Buffer.from(publicKey),
  });
}

/**
 * Get the wallet address in user-friendly format (non-bounceable, testnet).
 */
export function getWalletAddress(publicKey: Buffer | Uint8Array): string {
  const wallet = createWalletContract(publicKey);
  return wallet.address.toString({
    bounceable: false,
    testOnly: true,
    urlSafe: true,
  });
}
