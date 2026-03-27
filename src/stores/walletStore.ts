import { create } from 'zustand';
import type { EncryptedWallet, WalletKeys, ParsedTransaction, AddressBookEntry } from '../types';
import { STORAGE_KEYS } from '../constants/config';

interface WalletState {
  /** Whether an encrypted wallet exists in localStorage */
  hasWallet: boolean;
  /** Whether the wallet is currently unlocked (keys in memory) */
  isUnlocked: boolean;
  /** Wallet address (available even when locked) */
  address: string | null;
  /** Decrypted keys (only when unlocked, never persisted) */
  keys: WalletKeys | null;
  /** Current balance in nanoTON */
  balance: bigint | null;
  /** Recent transactions */
  transactions: ParsedTransaction[];
  /** Address book */
  addressBook: AddressBookEntry[];
  /** Loading states */
  loading: {
    balance: boolean;
    transactions: boolean;
    sending: boolean;
  };

  // Actions
  setHasWallet: (has: boolean) => void;
  setAddress: (address: string) => void;
  unlock: (keys: WalletKeys) => void;
  lock: () => void;
  setBalance: (balance: bigint) => void;
  setTransactions: (txs: ParsedTransaction[]) => void;
  setLoading: (key: keyof WalletState['loading'], value: boolean) => void;
  addToAddressBook: (entry: AddressBookEntry) => void;
  removeFromAddressBook: (address: string) => void;
}

function loadAddressBook(): AddressBookEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADDRESS_BOOK);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadEncryptedWallet(): EncryptedWallet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_WALLET);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const existingWallet = loadEncryptedWallet();

export const useWalletStore = create<WalletState>((set, get) => ({
  hasWallet: existingWallet !== null,
  isUnlocked: false,
  address: existingWallet?.address ?? null,
  keys: null,
  balance: null,
  transactions: [],
  addressBook: loadAddressBook(),
  loading: {
    balance: false,
    transactions: false,
    sending: false,
  },

  setHasWallet: (has) => set({ hasWallet: has }),
  setAddress: (address) => set({ address }),

  unlock: (keys) =>
    set({
      isUnlocked: true,
      keys,
    }),

  lock: () =>
    set({
      isUnlocked: false,
      keys: null,
      balance: null,
      transactions: [],
    }),

  setBalance: (balance) => set({ balance }),
  setTransactions: (txs) => set({ transactions: txs }),

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  addToAddressBook: (entry) => {
    const current = get().addressBook;
    const updated = [...current.filter((e) => e.address !== entry.address), entry];
    localStorage.setItem(STORAGE_KEYS.ADDRESS_BOOK, JSON.stringify(updated));
    set({ addressBook: updated });
  },

  removeFromAddressBook: (address) => {
    const updated = get().addressBook.filter((e) => e.address !== address);
    localStorage.setItem(STORAGE_KEYS.ADDRESS_BOOK, JSON.stringify(updated));
    set({ addressBook: updated });
  },
}));
