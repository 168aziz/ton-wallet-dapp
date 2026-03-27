import { PBKDF2_ITERATIONS } from '../../constants/config';

/**
 * Derive an AES-GCM key from a password using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt a mnemonic with a user password.
 */
export async function encryptMnemonic(
  mnemonic: string[],
  password: string,
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic.join(' '));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  return {
    ciphertext: bufferToHex(new Uint8Array(encrypted)),
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
  };
}

/**
 * Decrypt a mnemonic with a user password.
 * Throws if the password is incorrect.
 */
export async function decryptMnemonic(
  ciphertext: string,
  salt: string,
  iv: string,
  password: string,
): Promise<string[]> {
  const key = await deriveKey(password, hexToBuffer(salt));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBuffer(iv) as BufferSource },
    key,
    hexToBuffer(ciphertext) as BufferSource,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted).split(' ');
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
