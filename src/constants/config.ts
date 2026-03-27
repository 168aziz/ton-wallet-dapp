export const APP_NAME = 'TON Wallet';

export const TON_NETWORK = 'testnet' as const;

export const WALLET_VERSION = 'v4r2' as const;

/**
 * Default workchain for wallet addresses.
 * 0 = basechain (standard), -1 = masterchain
 */
export const WORKCHAIN = 0;

/**
 * Balance polling interval in milliseconds.
 */
export const BALANCE_POLL_INTERVAL_MS = 15_000;

/**
 * Number of transactions to fetch per page.
 */
export const TX_PAGE_SIZE = 20;

/**
 * Threshold (in TON) above which extra confirmation is required.
 */
export const HIGH_VALUE_TX_THRESHOLD = 50;

/**
 * Number of characters to match at prefix/suffix for address similarity detection.
 */
export const ADDRESS_SIMILARITY_PREFIX_LEN = 4;
export const ADDRESS_SIMILARITY_SUFFIX_LEN = 4;

/**
 * PBKDF2 iterations for password-based key derivation (wallet encryption).
 */
export const PBKDF2_ITERATIONS = 100_000;

/**
 * LocalStorage keys.
 */
export const STORAGE_KEYS = {
  ENCRYPTED_WALLET: 'ton_wallet_encrypted',
  ADDRESS_BOOK: 'ton_wallet_address_book',
  SETTINGS: 'ton_wallet_settings',
} as const;
