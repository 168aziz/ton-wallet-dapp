import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateMnemonic, deriveKeys, getWalletAddress } from '../../services/ton';
import { encryptMnemonic } from '../../services/crypto';
import { useWalletStore } from '../../stores/walletStore';
import { STORAGE_KEYS } from '../../constants/config';
import type { EncryptedWallet } from '../../types';

type Step = 'enter-mnemonic' | 'set-password';

export function ImportWalletPage() {
  const navigate = useNavigate();
  const { setHasWallet, setAddress } = useWalletStore();

  const [step, setStep] = useState<Step>('enter-mnemonic');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleWordChange = (index: number, value: string) => {
    const trimmed = value.trim();

    if (trimmed.includes(' ')) {
      const pasted = trimmed.split(/\s+/).filter(Boolean);
      if (pasted.length > 1) {
        const updated = [...words];
        pasted.forEach((w, i) => {
          if (index + i < 12) updated[index + i] = w.toLowerCase();
        });
        setWords(updated);
        return;
      }
    }

    const updated = [...words];
    updated[index] = value.toLowerCase();
    setWords(updated);
  };

  const handleValidate = async () => {
    const cleaned = words.map((w) => w.trim()).filter(Boolean);
    if (cleaned.length !== 12) {
      setError(`Enter all 12 words. You have ${cleaned.length}.`);
      return;
    }

    const valid = await validateMnemonic(cleaned);
    if (!valid) {
      setError('Invalid recovery phrase. Check your words and try again.');
      return;
    }

    setError('');
    setStep('set-password');
  };

  const handleSave = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const mnemonic = words.map((w) => w.trim());
      const keys = await deriveKeys(mnemonic);
      const address = getWalletAddress(keys.publicKey);
      const encrypted = await encryptMnemonic(mnemonic, password);

      const walletData: EncryptedWallet = { ...encrypted, address };
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_WALLET, JSON.stringify(walletData));

      setHasWallet(true);
      setAddress(address);
      navigate('/unlock');
    } catch {
      setError('Failed to import wallet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'enter-mnemonic') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10">
        <h1 className="text-2xl font-bold">Import Wallet</h1>
        <p className="text-center text-sm text-gray-500">
          Enter your 12-word recovery phrase. You can paste all words at once into the first field.
        </p>

        <div className="grid w-full max-w-sm grid-cols-3 gap-2">
          {words.map((word, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-5 text-right text-xs text-gray-400">{i + 1}.</span>
              <input
                type="text"
                value={word}
                onChange={(e) => handleWordChange(i, e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                autoFocus={i === 0}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleValidate}
          className="w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Validate & Continue
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Set Password</h1>
      <p className="text-center text-gray-500">
        This password encrypts your wallet on this device.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          className="rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
        />
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Confirm password"
          className="rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Importing wallet...' : 'Import Wallet'}
      </button>
    </div>
  );
}
