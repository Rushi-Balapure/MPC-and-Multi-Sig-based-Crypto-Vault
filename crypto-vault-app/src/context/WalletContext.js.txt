// src/context/WalletContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getWalletBalance, getTokensList } from '../services/api';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletState, setWalletState] = useState({
    isInitialized: false,
    isConnected: false,
    address: '',
    balance: '0.00',
    tokens: [],
    vault: {
      initialized: false,
      parties: [],
      quorum: 0,
      totalParties: 0,
    },
    loading: false,
    error: null
  });

  useEffect(() => {
    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      try {
        const parsedWallet = JSON.parse(savedWallet);
        setWalletState(prev => ({
          ...prev,
          isInitialized: true,
          isConnected: true,
          address: parsedWallet.address,
        }));
        
        // Fetch balance and tokens
        fetchWalletData(parsedWallet.address);
      } catch (error) {
        console.error("Failed to parse saved wallet", error);
      }
    }
  }, []);

  const fetchWalletData = async (address) => {
    setWalletState(prev => ({ ...prev, loading: true }));
    try {
      const balanceData = await getWalletBalance(address);
      const tokensData = await getTokensList(address);
      
      setWalletState(prev => ({
        ...prev,
        balance: balanceData.balance,
        tokens: tokensData,
        loading: false
      }));
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: "Failed to fetch wallet data",
        loading: false
      }));
    }
  };

  const connectWallet = async (address) => {
    setWalletState(prev => ({ ...prev, loading: true }));
    try {
      // Simulate wallet connection
      // In a real app, this would interact with MetaMask or another wallet
      
      const newWalletState = {
        isInitialized: true,
        isConnected: true,
        address: address || '0x1234...5678', // Placeholder address
        loading: false
      };
      
      setWalletState(prev => ({
        ...prev,
        ...newWalletState
      }));
      
      // Save to localStorage
      localStorage.setItem('wallet', JSON.stringify({
        address: newWalletState.address
      }));
      
      // Fetch balance and tokens
      fetchWalletData(newWalletState.address);
      
      return true;
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: "Failed to connect wallet",
        loading: false
      }));
      return false;
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem('wallet');
    setWalletState({
      isInitialized: true,
      isConnected: false,
      address: '',
      balance: '0.00',
      tokens: [],
      vault: {
        initialized: false,
        parties: [],
        quorum: 0,
        totalParties: 0,
      },
      loading: false,
      error: null
    });
  };

  // MPC Vault specific functions
  const initializeVault = (totalParties, quorum) => {
    // This would call your backend API to set up the MPC vault
    setWalletState(prev => ({
      ...prev,
      vault: {
        ...prev.vault,
        initialized: true,
        quorum,
        totalParties,
        parties: []
      }
    }));
  };

  const addPartyToVault = (partyAddress, partyName) => {
    // Would typically call API to add party to vault
    setWalletState(prev => ({
      ...prev,
      vault: {
        ...prev.vault,
        parties: [...prev.vault.parties, { address: partyAddress, name: partyName }]
      }
    }));
  };

  const removePartyFromVault = (partyAddress) => {
    setWalletState(prev => ({
      ...prev,
      vault: {
        ...prev.vault,
        parties: prev.vault.parties.filter(party => party.address !== partyAddress)
      }
    }));
  };

  return (
    <WalletContext.Provider value={{
      walletState,
      connectWallet,
      disconnectWallet,
      fetchWalletData,
      initializeVault,
      addPartyToVault,
      removePartyFromVault
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

export default WalletProvider;