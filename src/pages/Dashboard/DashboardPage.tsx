import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWalletStore } from '../../stores/walletStore';
import { useBalance } from '../../hooks/useBalance';
import { useTransactions } from '../../hooks/useTransactions';
import { formatTon } from '../../services/ton';
import { truncateAddress } from '../../utils';
import { copyToClipboard } from '../../utils/clipboard';
import type { ParsedTransaction } from '../../types';

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (isToday) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`;
}

function TxRow({ tx }: { tx: ParsedTransaction }) {
  const isIn = tx.direction === 'in';

  const explorerUrl = `https://testnet.tonviewer.com/transaction/${tx.hash}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-50"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${
        isIn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
      }`}>
        {isIn ? '↓' : '↑'}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`font-semibold ${isIn ? 'text-green-600' : 'text-gray-900'}`}>
            {isIn ? '+' : '−'}{formatTon(tx.amount)} TON
          </span>
          <span className="shrink-0 text-xs text-gray-400">
            {formatDate(tx.timestamp)}
          </span>
        </div>
        <p className="truncate text-xs text-gray-400 font-mono mt-0.5">
          {isIn ? 'From' : 'To'}: {truncateAddress(tx.address)}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {tx.comment && (
            <span className="truncate text-xs text-gray-500 italic">
              {tx.comment}
            </span>
          )}
          <span className="shrink-0 text-[10px] text-gray-300">
            fee: {formatTon(tx.fee)} TON
          </span>
        </div>
      </div>
    </a>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const address = useWalletStore((s) => s.address);
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);
  const loadingBalance = useWalletStore((s) => s.loading.balance);
  const loadingTxs = useWalletStore((s) => s.loading.transactions);
  const lock = useWalletStore((s) => s.lock);

  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const { refetch: refetchBalance } = useBalance();
  const { refetch: refetchTxs } = useTransactions();

  const filteredTxs = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.address.toLowerCase().includes(q) ||
        tx.comment?.toLowerCase().includes(q) ||
        formatTon(tx.amount).includes(q),
    );
  }, [transactions, search]);

  const handleCopy = async () => {
    if (!address) return;
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    refetchBalance();
    refetchTxs();
  };

  const handleLock = () => {
    lock();
    navigate('/');
  };

  const displayBalance = balance !== null ? formatTon(balance) : '0';

  return (
    <div className="flex min-h-screen flex-col pb-6">
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          TON Wallet
        </p>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-600">
            Testnet
          </span>
          <button onClick={handleLock} className="text-xs text-gray-400 hover:text-red-500 transition" title="Lock wallet">
            Lock
          </button>
        </div>
      </div>

      <div className="mx-6 mt-2 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-lg">
        <button
          onClick={handleCopy}
          className="flex w-full items-center gap-2 text-left transition hover:opacity-80"
          title="Copy address"
        >
          <span className="truncate font-mono text-sm opacity-80">
            {address ? truncateAddress(address, 8, 8) : '—'}
          </span>
          <span className="shrink-0 text-xs opacity-60">
            {copied ? '✓' : '⧉'}
          </span>
        </button>

        <div className="mt-5">
          <p className="text-4xl font-bold tracking-tight">
            {loadingBalance && balance === null ? (
              <span className="animate-pulse">···</span>
            ) : (
              <>{displayBalance}</>
            )}
          </p>
          <p className="mt-1 text-sm font-medium opacity-60">TON</p>
        </div>
      </div>

      <div className="mx-6 mt-5 grid grid-cols-2 gap-3">
        <Link
          to="/receive"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 font-medium shadow-sm transition hover:bg-gray-50"
        >
          <span className="text-lg">↓</span> Receive
        </Link>
        <Link
          to="/send"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="text-lg">↑</span> Send
        </Link>
      </div>

      <div className="mx-6 mt-6 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Transactions</h2>
          <button
            onClick={handleRefresh}
            className="text-xs text-blue-600 hover:text-blue-800 transition"
            disabled={loadingTxs}
          >
            {loadingTxs ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {transactions.length > 0 && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address, comment, or amount..."
            className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        )}

        <div className="mt-3 flex flex-col gap-1">
          {loadingTxs && transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="animate-pulse text-sm text-gray-400">Loading transactions...</p>
            </div>
          ) : filteredTxs.length > 0 ? (
            filteredTxs.map((tx) => <TxRow key={tx.hash} tx={tx} />)
          ) : transactions.length > 0 && search ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No transactions matching "{search}"</p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-2xl">💎</p>
              <p className="mt-2 text-sm text-gray-400">No transactions yet</p>
              <p className="mt-1 text-xs text-gray-300">
                Use <a href="https://t.me/testgiver_ton_bot" target="_blank" rel="noreferrer" className="text-blue-500 underline">@testgiver_ton_bot</a> to get testnet TON
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
