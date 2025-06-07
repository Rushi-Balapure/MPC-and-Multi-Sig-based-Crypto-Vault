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

// Updated PrivateRoute to handle loading state and session errors
const PrivateRoute = ({ children }) => {
  const { isLoggedIn, isLoading, sessionError } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (sessionError) {
    return <Navigate to="/auth" state={{ error: sessionError }} />;
  }

  return isLoggedIn ? children : <Navigate to="/auth" />;
};

// Updated AppRoutes component to handle auth state
const AppRoutes = () => {
  const { isLoggedIn, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={isLoggedIn ? <Navigate to="/" /> : <Auth />}
      />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/buy"
        element={
          <PrivateRoute>
            <MainLayout>
              <Buy />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/sell"
        element={
          <PrivateRoute>
            <MainLayout>
              <Sell />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/send"
        element={
          <PrivateRoute>
            <MainLayout>
              <Send />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/receive"
        element={
          <PrivateRoute>
            <MainLayout>
              <Receive />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <MainLayout>
              <UserProfile />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/team"
        element={
          <PrivateRoute>
            <MainLayout>
              <TeamManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/team/create"
        element={
          <PrivateRoute>
            <MainLayout>
              <CreateTeam />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <MainLayout>
              <TransactionHistory />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/transactions/:id"
        element={
          <PrivateRoute>
            <MainLayout>
              <TransactionDetails />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/transactions/create"
        element={
          <PrivateRoute>
            <MainLayout>
              <CreateTransaction />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <VaultProvider>
        <TeamProvider>
          <Router>
            <AppRoutes />
          </Router>
        </TeamProvider>
      </VaultProvider>
    </AuthProvider>
  );
}

export default App;