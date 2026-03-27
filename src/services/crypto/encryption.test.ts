import { describe, expect, it } from 'vitest';

import { decryptMnemonic, encryptMnemonic } from './encryption';

const mnemonic = [
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'abandon',
  'about',
];

describe('encryption', () => {
  it('encrypts and decrypts a mnemonic with the same password', async () => {
    const password = 'correct horse battery staple';
    const encrypted = await encryptMnemonic(mnemonic, password);

    const decrypted = await decryptMnemonic(
      encrypted.ciphertext,
      encrypted.salt,
      encrypted.iv,
      password,
    );

    expect(decrypted).toEqual(mnemonic);
  });

  it('produces different ciphertext for different passwords', async () => {
    const first = await encryptMnemonic(mnemonic, 'password-one');
    const second = await encryptMnemonic(mnemonic, 'password-two');

    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('produces different ciphertext for the same mnemonic encrypted twice', async () => {
    const password = 'same-password';
    const first = await encryptMnemonic(mnemonic, password);
    const second = await encryptMnemonic(mnemonic, password);

    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('throws when decrypting with a wrong password', async () => {
    const encrypted = await encryptMnemonic(mnemonic, 'correct-password');

    await expect(
      decryptMnemonic(
        encrypted.ciphertext,
        encrypted.salt,
        encrypted.iv,
        'wrong-password',
      ),
    ).rejects.toThrow();
  });
});
