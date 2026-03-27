import { Address } from '@ton/core';
import {
  ADDRESS_SIMILARITY_PREFIX_LEN,
  ADDRESS_SIMILARITY_SUFFIX_LEN,
} from '../constants/config';
import type { AddressValidation, SendWarning } from '../types';

/**
 * Validate a TON address string.
 */
export function validateAddress(raw: string): AddressValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw.trim()) {
    return { valid: false, errors: ['Address is required'], warnings };
  }

  try {
    const parsed = Address.parse(raw);
    const friendly = parsed.toString({ bounceable: false, testOnly: true, urlSafe: true });

    // Check if testnet flag is present
    const isTestnet = raw.startsWith('0') || raw.startsWith('k');
    const isBounceable = raw.startsWith('E') || raw.startsWith('k');

    if (!isTestnet && (raw.startsWith('E') || raw.startsWith('U'))) {
      warnings.push('This looks like a mainnet address. You are on testnet.');
    }

    if (isBounceable) {
      warnings.push('This is a bounceable address. Funds may bounce back if the recipient is not initialized.');
    }

    return {
      valid: true,
      address: friendly,
      isBounceable,
      isTestnet,
      errors,
      warnings,
    };
  } catch {
    return { valid: false, errors: ['Invalid TON address format'], warnings };
  }
}

/**
 * Truncate an address for display: first6...last6
 */
export function truncateAddress(address: string, prefixLen = 6, suffixLen = 6): string {
  if (address.length <= prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Detect addresses in history that are suspiciously similar to the target.
 * Returns warnings if a near-match is found (address poisoning indicator).
 */
export function detectAddressPoisoning(
  target: string,
  historyAddresses: string[],
): SendWarning | null {
  const targetPrefix = target.slice(0, ADDRESS_SIMILARITY_PREFIX_LEN);
  const targetSuffix = target.slice(-ADDRESS_SIMILARITY_SUFFIX_LEN);

  for (const known of historyAddresses) {
    if (known === target) continue;

    const knownPrefix = known.slice(0, ADDRESS_SIMILARITY_PREFIX_LEN);
    const knownSuffix = known.slice(-ADDRESS_SIMILARITY_SUFFIX_LEN);

    const prefixMatch = targetPrefix === knownPrefix;
    const suffixMatch = targetSuffix === knownSuffix;

    if (prefixMatch && suffixMatch) {
      return {
        id: 'address-poisoning',
        severity: 'danger',
        title: 'Possible Address Poisoning',
        message: `This address is suspiciously similar to a known address in your history (${truncateAddress(known)}). The first and last characters match but the middle differs. This is a common scam pattern. Verify the FULL address character by character.`,
        blocking: true,
      };
    }

    if (prefixMatch || suffixMatch) {
      return {
        id: 'address-similarity',
        severity: 'warning',
        title: 'Similar Address Detected',
        message: `This address partially matches ${truncateAddress(known)} from your history. Double-check you are sending to the correct recipient.`,
        blocking: false,
      };
    }
  }

  return null;
}
