import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Buy from './pages/Buy';
import Sell from './pages/Sell';
import Send from './pages/Send';
import Receive from './pages/Receive';
import UserProfile from './pages/UserProfile';
import TeamManagement from './pages/TeamManagement';
import CreateTeam from './pages/CreateTeam';
import TransactionDetails from './pages/TransactionDetails';
import { VaultProvider } from './context/VaultContext';
import { TeamProvider } from './context/TeamContext';
import TransactionHistory from './pages/TransactionHistory';
import CreateTransaction from './pages/CreateTransaction';
import Auth from './pages/Auth';

const PrivateRoute = ({ children }) => {
  // This would normally check auth state from your context
  // For now, let's create a simple check
  // const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  // return isAuthenticated ? children : <Navigate to="/auth" />;

  return children;
};

function App() {
  return (
    <VaultProvider>
      <TeamProvider>
        <Router>
          <Routes>
            {/* Auth routes - accessible without authentication */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes - require authentication */}
            <Route path="/" element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="receive" element={<Receive />} />
              <Route path="send" element={<Send />} />
              <Route path="buy" element={<Buy />} />
              <Route path="sell" element={<Sell />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="team/create" element={<CreateTeam />} />
              <Route path="team/transaction/:id" element={<TransactionDetails />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/create-transaction" element={<CreateTransaction />} />
            </Route>
            {/* Catch all redirect to auth page */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Router>
      </TeamProvider>
    </VaultProvider>
  );
}

export default App;