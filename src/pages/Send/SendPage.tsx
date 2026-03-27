import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../../stores/walletStore';
import { sendTransfer, waitForTransaction, formatTon } from '../../services/ton';
import type { ConfirmationResult } from '../../services/ton';
import { validateAddress, detectAddressPoisoning, truncateAddress } from '../../utils';
import { HIGH_VALUE_TX_THRESHOLD } from '../../constants/config';
import type { SendWarning } from '../../types';

type Step = 'form' | 'confirm' | 'sending' | 'success' | 'pending' | 'error';

const SEVERITY_STYLES: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  danger: 'border-red-300 bg-red-50 text-red-900',
};

const SEVERITY_ICON: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  danger: '🚨',
};

function WarningBanner({ warning }: { warning: SendWarning }) {
  return (
    <div className={`rounded-xl border-2 p-4 ${SEVERITY_STYLES[warning.severity]}`}>
      <p className="text-sm font-bold">
        {SEVERITY_ICON[warning.severity]} {warning.title}
      </p>
      <p className="mt-1 text-xs leading-relaxed">{warning.message}</p>
    </div>
  );
}

export function SendPage() {
  const navigate = useNavigate();
  const keys = useWalletStore((s) => s.keys);
  const address = useWalletStore((s) => s.address);
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);

  const [step, setStep] = useState<Step>('form');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [sendError, setSendError] = useState('');
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);

  const historyAddresses = useMemo(
    () => [...new Set(transactions.map((tx) => tx.address))],
    [transactions],
  );

  const addressValidation = useMemo(
    () => (recipient.trim() ? validateAddress(recipient.trim()) : null),
    [recipient],
  );

  const warnings = useMemo(() => {
    const list: SendWarning[] = [];
    if (!addressValidation?.valid) return list;

    const target = addressValidation.address ?? recipient.trim();

    if (target === address) {
      list.push({
        id: 'self-send',
        severity: 'warning',
        title: 'Sending to Yourself',
        message: 'The recipient address is your own wallet. Are you sure?',
        blocking: false,
      });
    }

    const poisoning = detectAddressPoisoning(target, historyAddresses);
    if (poisoning) list.push(poisoning);

    const isFirstTime = !historyAddresses.includes(target);
    if (isFirstTime && !poisoning) {
      list.push({
        id: 'first-time',
        severity: 'info',
        title: 'New Address',
        message: 'You have never sent to this address before. Double-check it is correct.',
        blocking: false,
      });
    }

    for (const w of addressValidation.warnings) {
      list.push({
        id: `addr-${w.slice(0, 20)}`,
        severity: 'warning',
        title: 'Address Warning',
        message: w,
        blocking: false,
      });
    }

    const tonAmount = parseFloat(amount);
    if (tonAmount > HIGH_VALUE_TX_THRESHOLD) {
      list.push({
        id: 'high-value',
        severity: 'danger',
        title: 'Large Transaction',
        message: `You are sending ${amount} TON. This is a large amount. Please verify all details carefully.`,
        blocking: true,
      });
    }

    return list;
  }, [addressValidation, recipient, amount, address, historyAddresses]);

  const hasBlockingWarning = warnings.some((w) => w.blocking);

  const handleReview = () => {
    setFormError('');

    if (!recipient.trim()) {
      setFormError('Enter recipient address.');
      return;
    }
    if (!addressValidation?.valid) {
      setFormError(addressValidation?.errors[0] ?? 'Invalid address.');
      return;
    }
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setFormError('Enter a valid amount greater than 0.');
      return;
    }
    if (balance !== null) {
      const nanoAmount = BigInt(Math.floor(parseFloat(amount) * 1e9));
      if (nanoAmount > balance) {
        setFormError(`Insufficient balance. You have ${formatTon(balance)} TON.`);
        return;
      }
    }

    setConfirmed(false);
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!keys) return;
    setStep('sending');
    setSendError('');

    let seqno: number;
    try {
      seqno = await sendTransfer({
        keys,
        to: recipient.trim(),
        amount: amount.trim(),
        comment: comment.trim() || undefined,
      });
    } catch (e: any) {
      setSendError(e?.message ?? 'Failed to send transaction. Check your connection and try again.');
      setStep('error');
      return;
    }

    const result = await waitForTransaction(keys.publicKey, seqno, 60_000);
    setConfirmResult(result);

    if (result === 'confirmed') {
      setStep('success');
    } else {
      setStep('pending');
    }
  };

  if (step === 'sending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <h1 className="text-xl font-bold">Sending {amount} TON</h1>
        <p className="text-sm text-gray-500">Waiting for network confirmation...</p>
        <p className="text-xs text-gray-400">This may take up to 60 seconds</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-xl font-bold">Transaction Confirmed</h1>
        <p className="text-sm text-gray-500">
          {amount} TON → {truncateAddress(recipient.trim())}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (step === 'pending') {
    const isPoorConnection = confirmResult === 'network-error';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
          ⏳
        </div>
        <h1 className="text-xl font-bold">Transaction Sent</h1>
        <p className="text-sm text-gray-500">
          {amount} TON → {truncateAddress(recipient.trim())}
        </p>
        <div className="max-w-sm rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-medium text-amber-800">
            {isPoorConnection
              ? 'Network issues prevented confirmation. Your transaction was sent — the network may be temporarily unavailable.'
              : 'Transaction was broadcast but confirmation timed out.'}
          </p>
          <p className="mt-2 text-xs text-amber-600">
            Check your balance in a few minutes or verify on{' '}
            <a
              href={`https://testnet.tonviewer.com/${address}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Tonviewer
            </a>
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 w-full max-w-sm rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          ✗
        </div>
        <h1 className="text-xl font-bold">Transaction Failed</h1>
        <p className="max-w-sm text-center text-sm text-red-600">{sendError}</p>
        <div className="mt-4 flex w-full max-w-sm gap-3">
          <button
            onClick={() => setStep('form')}
            className="flex-1 rounded-xl border border-gray-200 py-3 font-medium transition hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={handleSend}
            className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="flex min-h-screen flex-col gap-5 px-6 py-10">
        <div className="flex items-center">
          <button onClick={() => setStep('form')} className="text-sm text-gray-400 hover:text-gray-600">
            &larr; Edit
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">Confirm Transaction</h1>
          <div className="w-10" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Recipient</p>
              <p className="mt-1 break-all font-mono text-sm">{recipient.trim()}</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Amount</p>
              <p className="mt-1 text-2xl font-bold">{amount} TON</p>
            </div>
            {comment.trim() && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Comment</p>
                <p className="mt-1 text-sm text-gray-700">{comment}</p>
              </div>
            )}
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="flex flex-col gap-3">
            {warnings.map((w) => (
              <WarningBanner key={w.id} warning={w} />
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3">
          {(hasBlockingWarning || warnings.length > 0) && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600"
              />
              <span className="text-sm text-gray-700">
                I have verified the recipient address and amount are correct
              </span>
            </label>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-xl border border-gray-200 py-3 text-center font-medium transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={hasBlockingWarning && !confirmed}
            className="rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send {amount} TON
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-5 px-6 py-10">
      <div className="flex items-center">
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">
          &larr; Back
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Send TON</h1>
        <div className="w-10" />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0Q... or UQ... address"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          {addressValidation && !addressValidation.valid && recipient.trim() && (
            <p className="mt-1.5 text-xs text-red-500">{addressValidation.errors[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
            Amount (TON)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 text-lg focus:border-blue-500 focus:outline-none"
            />
            {balance !== null && (
              <button
                type="button"
                onClick={() => {
                  const maxTon = Number(balance) / 1e9;
                  const safe = Math.max(0, maxTon - 0.05);
                  setAmount(safe.toFixed(4));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-gray-200 transition"
              >
                MAX
              </button>
            )}
          </div>
          {balance !== null && (
            <p className="mt-1.5 text-xs text-gray-400">
              Available: {formatTon(balance)} TON
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
            Comment (optional)
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Message to recipient"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {warnings.length > 0 && recipient.trim() && (
        <div className="flex flex-col gap-3">
          {warnings.map((w) => (
            <WarningBanner key={w.id} warning={w} />
          ))}
        </div>
      )}

      {formError && (
        <p className="text-center text-sm text-red-500">{formError}</p>
      )}

      <button
        onClick={handleReview}
        className="mt-auto rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
      >
        Review Transaction
      </button>
    </div>
  );
}
