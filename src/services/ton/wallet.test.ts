import { describe, expect, it } from 'vitest';
import { deriveKeys, generateMnemonic, getWalletAddress, validateMnemonic } from './wallet';

describe('wallet service', () => {
  it('generateMnemonic returns 12 string words', async () => {
    const mnemonic = await generateMnemonic();

    expect(mnemonic).toHaveLength(12);
    expect(mnemonic.every((word) => typeof word === 'string')).toBe(true);
  });

  it('validateMnemonic returns true for valid mnemonic', async () => {
    const mnemonic = await generateMnemonic();

    await expect(validateMnemonic(mnemonic)).resolves.toBe(true);
  });

  it('validateMnemonic returns false for random garbage', async () => {
    const garbageMnemonic = [
      'garbage1',
      'garbage2',
      'garbage3',
      'garbage4',
      'garbage5',
      'garbage6',
      'garbage7',
      'garbage8',
      'garbage9',
      'garbage10',
      'garbage11',
      'garbage12',
    ];

    await expect(validateMnemonic(garbageMnemonic)).resolves.toBe(false);
  });

  it('deriveKeys returns mnemonic and expected key lengths', async () => {
    const mnemonic = await generateMnemonic();
    const keys = await deriveKeys(mnemonic);

    expect(keys.mnemonic).toEqual(mnemonic);
    expect(keys.publicKey).toBeInstanceOf(Uint8Array);
    expect(keys.secretKey).toBeInstanceOf(Uint8Array);
    expect(keys.publicKey).toHaveLength(32);
    expect(keys.secretKey).toHaveLength(64);
  });

  it('getWalletAddress returns testnet non-bounceable address prefix', async () => {
    const mnemonic = await generateMnemonic();
    const keys = await deriveKeys(mnemonic);
    const address = getWalletAddress(keys.publicKey);

    expect(typeof address).toBe('string');
    expect(address.startsWith('0Q')).toBe(true);
  });

  it('same mnemonic derives same keys and address', async () => {
    const mnemonic = await generateMnemonic();

    const first = await deriveKeys(mnemonic);
    const second = await deriveKeys(mnemonic);

    expect(first.mnemonic).toEqual(second.mnemonic);
    expect(Array.from(first.publicKey)).toEqual(Array.from(second.publicKey));
    expect(Array.from(first.secretKey)).toEqual(Array.from(second.secretKey));
    expect(getWalletAddress(first.publicKey)).toBe(getWalletAddress(second.publicKey));
  });
});
