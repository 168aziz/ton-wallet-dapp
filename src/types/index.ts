/**
 * Encrypted wallet data stored in localStorage.
 */
export interface EncryptedWallet {
  /** AES-GCM encrypted mnemonic */
  ciphertext: string;
  /** Random salt for PBKDF2 (hex) */
  salt: string;
  /** Initialization vector for AES-GCM (hex) */
  iv: string;
  /** Wallet address (non-bounceable, testnet) for display without decryption */
  address: string;
}

/**
 * Decrypted wallet state held in memory only.
 */
export interface WalletKeys {
  mnemonic: string[];
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * Parsed transaction for display.
 */
export interface ParsedTransaction {
  hash: string;
  lt: string;
  timestamp: number;
  /** 'in' = received, 'out' = sent */
  direction: 'in' | 'out';
  /** Amount in nanoTON */
  amount: bigint;
  /** Counterparty address (sender or recipient) */
  address: string;
  /** Optional comment/memo */
  comment?: string;
  /** Transaction fee in nanoTON */
  fee: bigint;
}

/**
 * Address book entry.
 */
export interface AddressBookEntry {
  address: string;
  label: string;
  addedAt: number;
}

/**
 * Account status on the blockchain.
 */
export type AccountStatus = 'nonexist' | 'uninit' | 'active' | 'frozen';

/**
 * Result of address validation with warnings.
 */
export interface AddressValidation {
  valid: boolean;
  address?: string;
  isBounceable?: boolean;
  isTestnet?: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Send flow warning severity.
 */
export type WarningSeverity = 'info' | 'warning' | 'danger';

/**
 * Warning to display in the send flow.
 */
export interface SendWarning {
  id: string;
  severity: WarningSeverity;
  title: string;
  message: string;
  /** If true, user must explicitly acknowledge before proceeding */
  blocking: boolean;
}
