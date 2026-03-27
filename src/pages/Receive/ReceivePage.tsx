import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useWalletStore } from '../../stores/walletStore';
import { copyToClipboard } from '../../utils/clipboard';

export function ReceivePage() {
  const navigate = useNavigate();
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

  const tonLink = `ton://transfer/${address}`;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10">
      <div className="flex w-full max-w-sm items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          &larr; Back
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Receive TON</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <QRCodeSVG
          value={tonLink}
          size={200}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      <div className="w-full max-w-sm">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
          Your wallet address
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="break-all text-center font-mono text-sm select-all">
            {address}
          </p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={`w-full max-w-sm rounded-xl px-6 py-3 font-medium transition ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {copied ? 'Copied!' : 'Copy Address'}
      </button>

      <p className="max-w-sm text-center text-xs text-gray-400">
        Send only TON to this address. This is a testnet wallet.
      </p>
    </div>
  );
}
