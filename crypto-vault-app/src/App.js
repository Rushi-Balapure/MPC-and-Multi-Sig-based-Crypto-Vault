import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <VaultProvider> 
      <TeamProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
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
            </Route>
          </Routes>
        </Router>
      </TeamProvider>
    </VaultProvider>
  );
}

export default App;
