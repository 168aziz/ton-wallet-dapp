import { describe, expect, it } from 'vitest';
import {
  detectAddressPoisoning,
  truncateAddress,
  validateAddress,
} from './address';

const VALID_TESTNET_NON_BOUNCEABLE =
  '0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACkT';
const VALID_TESTNET_BOUNCEABLE =
  'kQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHTW';
const VALID_MAINNET_NON_BOUNCEABLE =
  'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ';

describe('validateAddress', () => {
  it('returns error for empty string', () => {
    const result = validateAddress('   ');

    expect(result).toEqual({
      valid: false,
      errors: ['Address is required'],
      warnings: [],
    });
  });

  it('validates a testnet non-bounceable address', () => {
    const result = validateAddress(VALID_TESTNET_NON_BOUNCEABLE);

    expect(result.valid).toBe(true);
    expect(result.address).toBe(VALID_TESTNET_NON_BOUNCEABLE);
    expect(result.isTestnet).toBe(true);
    expect(result.isBounceable).toBe(false);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('returns error for invalid garbage address', () => {
    const result = validateAddress('not-a-ton-address');

    expect(result).toEqual({
      valid: false,
      errors: ['Invalid TON address format'],
      warnings: [],
    });
  });

  it('warns for valid mainnet address when app expects testnet', () => {
    const result = validateAddress(VALID_MAINNET_NON_BOUNCEABLE);

    expect(result.valid).toBe(true);
    expect(result.isTestnet).toBe(false);
    expect(result.warnings).toContain(
      'This looks like a mainnet address. You are on testnet.',
    );
  });

  it('warns for bounceable address', () => {
    const result = validateAddress(VALID_TESTNET_BOUNCEABLE);

    expect(result.valid).toBe(true);
    expect(result.isTestnet).toBe(true);
    expect(result.isBounceable).toBe(true);
    expect(result.warnings).toContain(
      'This is a bounceable address. Funds may bounce back if the recipient is not initialized.',
    );
  });
});

describe('truncateAddress', () => {
  it('truncates long addresses with default lengths', () => {
    const result = truncateAddress('abcdefghijklmnopqrstuvwxyz');

    expect(result).toBe('abcdef...uvwxyz');
  });

  it('returns original address when already short enough', () => {
    const address = 'short-address';

    expect(truncateAddress(address)).toBe(address);
  });

  it('truncates with custom prefix and suffix lengths', () => {
    const result = truncateAddress('abcdefghijklmnopqrstuvwxyz', 3, 4);

    expect(result).toBe('abc...wxyz');
  });
});

describe('detectAddressPoisoning', () => {
  const target = VALID_TESTNET_NON_BOUNCEABLE;
  const prefix = target.slice(0, 4);
  const suffix = target.slice(-4);

  it('returns null for exact match', () => {
    const result = detectAddressPoisoning(target, [target]);

    expect(result).toBeNull();
  });

  it('returns danger blocking warning when both prefix and suffix match', () => {
    const known = `${prefix}MIDDIFFERENTVALUE${suffix}`;

    const result = detectAddressPoisoning(target, [known]);

    expect(result).toMatchObject({
      id: 'address-poisoning',
      severity: 'danger',
      title: 'Possible Address Poisoning',
      blocking: true,
    });
  });

  it('returns warning when only prefix matches', () => {
    const known = `${prefix}completelydifferenttailZZZZ`;

    const result = detectAddressPoisoning(target, [known]);

    expect(result).toMatchObject({
      id: 'address-similarity',
      severity: 'warning',
      title: 'Similar Address Detected',
      blocking: false,
    });
  });

  it('returns warning when only suffix matches', () => {
    const known = `DIFFcompletelydifferentmiddle${suffix}`;

    const result = detectAddressPoisoning(target, [known]);

    expect(result).toMatchObject({
      id: 'address-similarity',
      severity: 'warning',
      title: 'Similar Address Detected',
      blocking: false,
    });
  });

  it('returns null when no history address is similar', () => {
    const history = ['AAAAbbbbccccdddd', 'WXYZ1234LMNO5678'];

    const result = detectAddressPoisoning(target, history);

    expect(result).toBeNull();
  });
});
