import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateMnemonic, deriveKeys, getWalletAddress } from '../../services/ton';
import { encryptMnemonic } from '../../services/crypto';
import { useWalletStore } from '../../stores/walletStore';
import { STORAGE_KEYS } from '../../constants/config';
import type { EncryptedWallet } from '../../types';

type Step = 'generating' | 'show-mnemonic' | 'confirm-mnemonic' | 'set-password';

export function CreateWalletPage() {
  const navigate = useNavigate();
  const { setHasWallet, setAddress } = useWalletStore();

  const [step, setStep] = useState<Step>('generating');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmWordIndex, setConfirmWordIndex] = useState(0);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    const words = await generateMnemonic();
    setMnemonic(words);
    setConfirmWordIndex(Math.floor(Math.random() * 12));
    setStep('show-mnemonic');
  };

  const handleConfirmWord = () => {
    if (confirmInput.trim().toLowerCase() !== mnemonic[confirmWordIndex].toLowerCase()) {
      setError(`Wrong word. Please enter word #${confirmWordIndex + 1} from your mnemonic.`);
      return;
    }
    setError('');
    setConfirmInput('');
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
      const keys = await deriveKeys(mnemonic);
      const address = getWalletAddress(keys.publicKey);
      const encrypted = await encryptMnemonic(mnemonic, password);

      const walletData: EncryptedWallet = { ...encrypted, address };
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_WALLET, JSON.stringify(walletData));

      setHasWallet(true);
      setAddress(address);
      navigate('/unlock');
    } catch (e) {
      setError('Failed to create wallet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'generating') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-2xl font-bold">Create New Wallet</h1>
        <p className="text-center text-gray-500">
          We will generate a 12-word recovery phrase. Keep it safe — it is the only way to restore your wallet.
        </p>
        <button
          onClick={handleGenerate}
          className="w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Generate Recovery Phrase
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

  if (step === 'show-mnemonic') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10">
        <h1 className="text-2xl font-bold">Your Recovery Phrase</h1>
        <p className="text-center text-sm text-red-500 font-medium">
          Write these 12 words down and store them securely. Never share them with anyone.
        </p>

        <div className="grid w-full max-w-sm grid-cols-3 gap-2">
          {mnemonic.map((word, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-center text-sm"
            >
              <span className="text-gray-400 mr-1">{i + 1}.</span>
              <span className="font-medium">{word}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep('confirm-mnemonic')}
          className="w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          I Have Written It Down
        </button>
      </div>
    );
  }

  if (step === 'confirm-mnemonic') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-2xl font-bold">Verify Recovery Phrase</h1>
        <p className="text-center text-gray-500">
          Enter word <span className="font-bold text-black">#{confirmWordIndex + 1}</span> from your recovery phrase.
        </p>

        <input
          type="text"
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirmWord()}
          placeholder={`Word #${confirmWordIndex + 1}`}
          className="w-full max-w-sm rounded-xl border border-gray-300 px-4 py-3 text-center focus:border-blue-500 focus:outline-none"
          autoFocus
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleConfirmWord}
          className="w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Confirm
        </button>
        <button
          onClick={() => { setStep('show-mnemonic'); setError(''); }}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Show phrase again
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
        {saving ? 'Creating wallet...' : 'Create Wallet'}
      </button>
    </div>
  );
}
