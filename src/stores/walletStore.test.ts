import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../constants/config';
import { useWalletStore } from './walletStore';
import type { AddressBookEntry, ParsedTransaction, WalletKeys } from '../types';

const resetState = {
  hasWallet: false,
  isUnlocked: false,
  address: null as string | null,
  keys: null as WalletKeys | null,
  balance: null as bigint | null,
  transactions: [] as ParsedTransaction[],
  addressBook: [] as AddressBookEntry[],
  loading: {
    balance: false,
    transactions: false,
    sending: false,
  },
};

describe('useWalletStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useWalletStore.setState(resetState);
  });

  it('starts from expected cleared state', () => {
    const state = useWalletStore.getState();

    expect(state.hasWallet).toBe(false);
    expect(state.isUnlocked).toBe(false);
    expect(state.address).toBeNull();
    expect(state.keys).toBeNull();
    expect(state.balance).toBeNull();
    expect(state.transactions).toEqual([]);
    expect(state.addressBook).toEqual([]);
    expect(state.loading).toEqual({
      balance: false,
      transactions: false,
      sending: false,
    });
  });

  it('setHasWallet updates hasWallet', () => {
    useWalletStore.getState().setHasWallet(true);
    expect(useWalletStore.getState().hasWallet).toBe(true);

    useWalletStore.getState().setHasWallet(false);
    expect(useWalletStore.getState().hasWallet).toBe(false);
  });

  it('setAddress updates address', () => {
    const address = 'EQBtestAddress1234567890';
    useWalletStore.getState().setAddress(address);

    expect(useWalletStore.getState().address).toBe(address);
  });

  it('unlock sets isUnlocked to true and stores keys', () => {
    const keys: WalletKeys = {
      mnemonic: ['word1', 'word2', 'word3'],
      publicKey: new Uint8Array([1, 2, 3]),
      secretKey: new Uint8Array([4, 5, 6]),
    };

    useWalletStore.getState().unlock(keys);
    const state = useWalletStore.getState();

    expect(state.isUnlocked).toBe(true);
    expect(state.keys).toEqual(keys);
  });

  it('lock clears keys balance transactions and sets isUnlocked to false', () => {
    const keys: WalletKeys = {
      mnemonic: ['word1', 'word2', 'word3'],
      publicKey: new Uint8Array([1, 2, 3]),
      secretKey: new Uint8Array([4, 5, 6]),
    };
    const txs: ParsedTransaction[] = [
      {
        hash: 'h1',
        lt: '1',
        timestamp: 1,
        direction: 'out',
        amount: 10n,
        address: 'EQBrecipient',
        fee: 1n,
      },
    ];

    const store = useWalletStore.getState();
    store.unlock(keys);
    store.setBalance(123n);
    store.setTransactions(txs);

    useWalletStore.getState().lock();
    const state = useWalletStore.getState();

    expect(state.isUnlocked).toBe(false);
    expect(state.keys).toBeNull();
    expect(state.balance).toBeNull();
    expect(state.transactions).toEqual([]);
  });

  it('lock after unlock round-trip returns to locked state', () => {
    const keys: WalletKeys = {
      mnemonic: ['alpha', 'beta', 'gamma'],
      publicKey: new Uint8Array([11, 12]),
      secretKey: new Uint8Array([21, 22]),
    };

    useWalletStore.getState().unlock(keys);
    expect(useWalletStore.getState().isUnlocked).toBe(true);

    useWalletStore.getState().lock();
    const state = useWalletStore.getState();

    expect(state.isUnlocked).toBe(false);
    expect(state.keys).toBeNull();
  });

  it('setBalance stores bigint values', () => {
    const balance = 9876543210123456789n;

    useWalletStore.getState().setBalance(balance);

    expect(useWalletStore.getState().balance).toBe(balance);
  });

  it('setTransactions updates transactions list', () => {
    const txs: ParsedTransaction[] = [
      {
        hash: 'tx-1',
        lt: '100',
        timestamp: 1_700_000_000,
        direction: 'in',
        amount: 1_000_000n,
        address: 'EQBsender',
        comment: 'memo',
        fee: 100n,
      },
      {
        hash: 'tx-2',
        lt: '101',
        timestamp: 1_700_000_001,
        direction: 'out',
        amount: 2_000_000n,
        address: 'EQBrecipient',
        fee: 200n,
      },
    ];

    useWalletStore.getState().setTransactions(txs);

    expect(useWalletStore.getState().transactions).toEqual(txs);
  });

  it('setLoading updates different loading keys independently', () => {
    const store = useWalletStore.getState();

    store.setLoading('balance', true);
    store.setLoading('sending', true);

    expect(useWalletStore.getState().loading).toEqual({
      balance: true,
      transactions: false,
      sending: true,
    });
  });

  it('addToAddressBook adds entry and persists to localStorage', () => {
    const entry: AddressBookEntry = {
      address: 'EQBbook1',
      label: 'Alice',
      addedAt: 1,
    };

    useWalletStore.getState().addToAddressBook(entry);

    expect(useWalletStore.getState().addressBook).toEqual([entry]);
    expect(localStorage.getItem(STORAGE_KEYS.ADDRESS_BOOK)).toBe(JSON.stringify([entry]));
  });

  it('addToAddressBook replaces existing entry with the same address', () => {
    const first: AddressBookEntry = {
      address: 'EQBsame',
      label: 'Old Label',
      addedAt: 1,
    };
    const replacement: AddressBookEntry = {
      address: 'EQBsame',
      label: 'New Label',
      addedAt: 2,
    };

    const store = useWalletStore.getState();
    store.addToAddressBook(first);
    store.addToAddressBook(replacement);

    expect(useWalletStore.getState().addressBook).toEqual([replacement]);
    expect(localStorage.getItem(STORAGE_KEYS.ADDRESS_BOOK)).toBe(JSON.stringify([replacement]));
  });

  it('removeFromAddressBook removes entry and persists to localStorage', () => {
    const first: AddressBookEntry = {
      address: 'EQBremove',
      label: 'To Remove',
      addedAt: 1,
    };
    const second: AddressBookEntry = {
      address: 'EQBkeep',
      label: 'Keep',
      addedAt: 2,
    };

    const store = useWalletStore.getState();
    store.addToAddressBook(first);
    store.addToAddressBook(second);
    store.removeFromAddressBook(first.address);

    expect(useWalletStore.getState().addressBook).toEqual([second]);
    expect(localStorage.getItem(STORAGE_KEYS.ADDRESS_BOOK)).toBe(JSON.stringify([second]));
  });
});
