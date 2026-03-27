import { Link } from 'react-router-dom';
import { useWalletStore } from '../../stores/walletStore';
import { copyToClipboard } from '../../utils/clipboard';
import { useState } from 'react';

export function DashboardPage() {
  const address = useWalletStore((s) => s.address);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-6">
      <div className="mb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">TON Wallet · Testnet</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white">
        <p className="text-sm opacity-80">Your address</p>
        <button
          onClick={handleCopy}
          className="mt-1 w-full text-left font-mono text-sm break-all hover:opacity-80 transition"
          title="Click to copy full address"
        >
          {address ?? '—'}
        </button>
        {copied && (
          <p className="mt-1 text-xs text-blue-200">Copied!</p>
        )}

        <div className="mt-4 text-sm opacity-80">Balance</div>
        <p className="text-3xl font-bold">— TON</p>
        <p className="text-xs opacity-60 mt-1">Balance and history coming soon</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          to="/receive"
          className="rounded-xl border border-gray-200 py-3 text-center font-medium transition hover:bg-gray-50"
        >
          Receive
        </Link>
        <Link
          to="/send"
          className="rounded-xl bg-blue-600 py-3 text-center font-medium text-white transition hover:bg-blue-700"
        >
          Send
        </Link>
      </div>
    </div>
  );
}
