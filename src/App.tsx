import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWalletStore } from './stores/walletStore';
import { WelcomePage } from './pages/Welcome';
import { CreateWalletPage } from './pages/CreateWallet';
import { ImportWalletPage } from './pages/ImportWallet';
import { UnlockPage } from './pages/Unlock';
import { DashboardPage } from './pages/Dashboard';
import { ReceivePage } from './pages/Receive';
import { SendPage } from './pages/Send';

function AppRoutes() {
  const hasWallet = useWalletStore((s) => s.hasWallet);
  const isUnlocked = useWalletStore((s) => s.isUnlocked);

  return (
    <Routes>
      <Route
        path="/"
        element={
          !hasWallet ? (
            <WelcomePage />
          ) : !isUnlocked ? (
            <Navigate to="/unlock" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route path="/create" element={<CreateWalletPage />} />
      <Route path="/import" element={<ImportWalletPage />} />
      <Route path="/unlock" element={hasWallet ? <UnlockPage /> : <Navigate to="/" replace />} />
      <Route
        path="/dashboard"
        element={isUnlocked ? <DashboardPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/receive"
        element={isUnlocked ? <ReceivePage /> : <Navigate to="/" replace />}
      />
      <Route path="/send" element={isUnlocked ? <SendPage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/ton-wallet-dapp">
      <div className="mx-auto min-h-screen w-full bg-white shadow-none sm:my-6 sm:max-w-lg sm:min-h-0 sm:rounded-2xl sm:shadow-xl md:max-w-xl lg:max-w-2xl">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
