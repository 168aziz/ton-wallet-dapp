import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { decryptMnemonic } from '../../services/crypto';
import { deriveKeys, getWalletAddress } from '../../services/ton';
import { useWalletStore } from '../../stores/walletStore';
import { STORAGE_KEYS } from '../../constants/config';
import type { EncryptedWallet } from '../../types';

export function UnlockPage() {
  const navigate = useNavigate();
  const { unlock, setAddress } = useWalletStore();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_WALLET);
      if (!raw) throw new Error('No wallet found');

      const wallet: EncryptedWallet = JSON.parse(raw);
      const mnemonic = await decryptMnemonic(wallet.ciphertext, wallet.salt, wallet.iv, password);
      const keys = await deriveKeys(mnemonic);
      const address = getWalletAddress(keys.publicKey);

      setAddress(address);
      unlock(keys);
      navigate('/dashboard');
    } catch {
      setError('Wrong password or corrupted wallet data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 sm:min-h-0 sm:py-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Unlock Wallet</h1>
        <p className="mt-2 text-gray-500">Enter your password to continue</p>
      </div>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
        placeholder="Password"
        className="w-full max-w-sm rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none sm:max-w-md"
        autoFocus
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleUnlock}
        disabled={loading}
        className="w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 sm:max-w-md"
      >
        {loading ? 'Unlocking...' : 'Unlock'}
      </button>
    </div>
  );
}
