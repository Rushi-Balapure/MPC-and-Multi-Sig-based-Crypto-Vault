// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
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
import { AuthProvider, AuthContext } from './context/AuthContext';
import TransactionHistory from './pages/TransactionHistory';
import CreateTransaction from './pages/CreateTransaction';
import Auth from './pages/Auth';

// Updated PrivateRoute to use AuthContext directly
const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext);
  return isLoggedIn ? children : <Navigate to="/auth" />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Auth route */}
    <Route path="/auth" element={<Auth />} />

    {/* Protected routes inside MainLayout */}
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

    {/* Catch-all redirect to auth */}
    <Route path="*" element={<Navigate to="/auth" replace />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <VaultProvider>
          <Router>
            <AppRoutes />
          </Router>
        </VaultProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;