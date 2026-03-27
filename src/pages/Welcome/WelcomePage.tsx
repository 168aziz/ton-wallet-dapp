import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">TON Wallet</h1>
        <p className="mt-2 text-gray-500">Testnet self-custodial wallet</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          to="/create"
          className="rounded-xl bg-blue-600 px-6 py-3 text-center font-medium text-white transition hover:bg-blue-700"
        >
          Create New Wallet
        </Link>
        <Link
          to="/import"
          className="rounded-xl border border-gray-300 px-6 py-3 text-center font-medium transition hover:bg-gray-50"
        >
          Import Existing Wallet
        </Link>
      </div>
    </div>
  );
}
