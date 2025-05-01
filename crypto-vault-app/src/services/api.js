// // src/services/api.js

// import axios from 'axios';
// import { ethers } from 'ethers';

// // API configuration
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-api-gateway.execute-api.us-east-1.amazonaws.com/prod';
// const VAULT_CONTRACT_ABI = require('../contracts/VaultContract.json');
// const VAULT_CONTRACT_ADDRESS = process.env.REACT_APP_VAULT_CONTRACT_ADDRESS;

// // Initialize Ethereum provider
// let provider;
// let signer;
// let vaultContract;

// /**
//  * Initialize the Web3 connection and contracts
//  */
// export const initializeWeb3 = async () => {
//   try {
//     // Check if MetaMask is installed
//     if (window.ethereum) {
//       provider = new ethers.providers.Web3Provider(window.ethereum);
      
//       // Request account access
//       await window.ethereum.request({ method: 'eth_requestAccounts' });
      
//       signer = provider.getSigner();
//       vaultContract = new ethers.Contract(
//         VAULT_CONTRACT_ADDRESS,
//         VAULT_CONTRACT_ABI.abi,
//         signer
//       );
      
//       return { provider, signer, vaultContract };
//     } else {
//       console.error("Please install MetaMask or another Ethereum wallet.");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error initializing Web3:", error);
//     return null;
//   }
// };

// /**
//  * API request wrapper with error handling
//  */
// const apiRequest = async (method, endpoint, data = null, config = {}) => {
//   try {
//     const url = `${API_BASE_URL}${endpoint}`;
//     const response = await axios({
//       method,
//       url,
//       data,
//       ...config,
//     });
//     return response.data;
//   } catch (error) {
//     console.error(`API Error (${method} ${endpoint}):`, error);
//     throw error;
//   }
// };

// // Auth API functions
// export const loginUser = async (email, password) => {
//   return await apiRequest('post', '/auth/login', { email, password });
// };

// export const registerUser = async (name, email, password) => {
//   return await apiRequest('post', '/auth/register', { name, email, password });
// };

// export const verifyEmail = async (token) => {
//   return await apiRequest('post', '/auth/verify-email', { token });
// };

// export const resetPassword = async (email) => {
//   return await apiRequest('post', '/auth/reset-password', { email });
// };

// export const changePassword = async (token, newPassword) => {
//   return await apiRequest('post', '/auth/change-password', { token, newPassword });
// };

// // Wallet API functions
// export const createWallet = async (userId) => {
//   return await apiRequest('post', '/wallet/create', { userId });
// };

// export const getWalletBalance = async (walletId) => {
//   return await apiRequest('get', `/wallet/${walletId}/balance`);
// };

// export const getWalletTokens = async (walletId) => {
//   return await apiRequest('get', `/wallet/${walletId}/tokens`);
// };

// export const getWalletTransactions = async (walletId, page = 1, limit = 10) => {
//   return await apiRequest('get', `/wallet/${walletId}/transactions`, null, {
//     params: { page, limit }
//   });
// };

// // Vault API functions
// export const createVault = async (name, description, quorum, tokenSymbols) => {
//   try {
//     // Create vault metadata through API
//     const vaultMetadata = await apiRequest('post', '/vault/create', {
//       name,
//       description,
//       quorum,
//       tokenSymbols
//     });
    
//     // Create vault on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.createVault(
//         vaultMetadata.vaultId,
//         quorum,
//         tokenSymbols.map(symbol => ethers.utils.formatBytes32String(symbol))
//       );
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       // Update vault with blockchain transaction details
//       await apiRequest('put', `/vault/${vaultMetadata.vaultId}/confirm`, {
//         transactionHash: receipt.transactionHash,
//         blockNumber: receipt.blockNumber
//       });
      
//       return {
//         ...vaultMetadata,
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error creating vault:", error);
//     throw error;
//   }
// };

// export const getVault = async (vaultId) => {
//   return await apiRequest('get', `/vault/${vaultId}`);
// };

// export const getVaultParties = async (vaultId) => {
//   return await apiRequest('get', `/vault/${vaultId}/parties`);
// };

// export const addVaultParty = async (vaultId, partyName, partyAddress, role) => {
//   try {
//     // Add party metadata through API
//     const partyMetadata = await apiRequest('post', `/vault/${vaultId}/parties`, {
//       name: partyName,
//       address: partyAddress,
//       role
//     });
    
//     // Add party on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.addParty(
//         vaultId,
//         partyAddress,
//         ethers.utils.formatBytes32String(role)
//       );
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       return {
//         ...partyMetadata,
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error adding vault party:", error);
//     throw error;
//   }
// };

// export const removeVaultParty = async (vaultId, partyAddress) => {
//   try {
//     // Remove party metadata through API
//     await apiRequest('delete', `/vault/${vaultId}/parties/${partyAddress}`);
    
//     // Remove party on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.removeParty(vaultId, partyAddress);
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       return {
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error removing vault party:", error);
//     throw error;
//   }
// };

// // Transaction API functions
// export const createTransaction = async (vaultId, tokenSymbol, amount, recipient, memo = '') => {
//   try {
//     // Create transaction metadata through API
//     const txMetadata = await apiRequest('post', `/vault/${vaultId}/transactions`, {
//       tokenSymbol,
//       amount,
//       recipient,
//       memo
//     });
    
//     // Create transaction on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.createTransaction(
//         vaultId,
//         ethers.utils.formatBytes32String(tokenSymbol),
//         ethers.utils.parseUnits(amount.toString(), 18),
//         recipient,
//         memo
//       );
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       // Update transaction with blockchain details
//       await apiRequest('put', `/vault/${vaultId}/transactions/${txMetadata.transactionId}/confirm`, {
//         transactionHash: receipt.transactionHash,
//         blockNumber: receipt.blockNumber
//       });
      
//       return {
//         ...txMetadata,
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error creating transaction:", error);
//     throw error;
//   }
// };

// export const approveTransaction = async (vaultId, transactionId) => {
//   try {
//     // Record approval intent through API
//     await apiRequest('post', `/vault/${vaultId}/transactions/${transactionId}/approvals`, {
//       approver: await signer.getAddress()
//     });
    
//     // Approve transaction on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.approveTransaction(vaultId, transactionId);
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       return {
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error approving transaction:", error);
//     throw error;
//   }
// };

// export const executeTransaction = async (vaultId, transactionId) => {
//   try {
//     // Execute transaction on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.executeTransaction(vaultId, transactionId);
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       // Update transaction status through API
//       await apiRequest('put', `/vault/${vaultId}/transactions/${transactionId}/execute`, {
//         transactionHash: receipt.transactionHash,
//         blockNumber: receipt.blockNumber
//       });
      
//       return {
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error executing transaction:", error);
//     throw error;
//   }
// };

// // Market data API functions
// export const getTokenPrice = async (tokenSymbol) => {
//   return await apiRequest('get', `/market/price/${tokenSymbol}`);
// };

// export const getExchangeRates = async (baseCurrency = 'USD') => {
//   return await apiRequest('get', `/market/exchange-rates`, null, {
//     params: { base: baseCurrency }
//   });
// };

// // Sell API functions - for exchange/liquidation
// export const getSellQuote = async (tokenSymbol, amount, payoutMethod) => {
//   return await apiRequest('get', `/market/sell-quote`, null, {
//     params: { tokenSymbol, amount, payoutMethod }
//   });
// };

// export const createSellOrder = async (vaultId, tokenSymbol, amount, payoutMethod, accountDetails) => {
//   return await apiRequest('post', `/vault/${vaultId}/sell`, {
//     tokenSymbol,
//     amount,
//     payoutMethod,
//     accountDetails
//   });
// };

// export const approveSellOrder = async (vaultId, sellOrderId) => {
//   try {
//     // Record approval intent through API
//     await apiRequest('post', `/vault/${vaultId}/sell/${sellOrderId}/approvals`, {
//       approver: await signer.getAddress()
//     });
    
//     // Approve sell order on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.approveSellOrder(vaultId, sellOrderId);
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       return {
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error approving sell order:", error);
//     throw error;
//   }
// };

// export const executeSellOrder = async (vaultId, sellOrderId) => {
//   try {
//     // Execute sell order on blockchain using smart contract
//     if (vaultContract) {
//       const tx = await vaultContract.executeSellOrder(vaultId, sellOrderId);
      
//       // Wait for transaction receipt
//       const receipt = await tx.wait();
      
//       // Update sell order status through API
//       await apiRequest('put', `/vault/${vaultId}/sell/${sellOrderId}/execute`, {
//         transactionHash: receipt.transactionHash,
//         blockNumber: receipt.blockNumber
//       });
      
//       return {
//         transactionHash: receipt.transactionHash
//       };
//     } else {
//       throw new Error("Vault contract not initialized.");
//     }
//   } catch (error) {
//     console.error("Error executing sell order:", error);
//     throw error;
//   }
// };

// // Buy API functions
// export const getBuyQuote = async (tokenSymbol, amount, paymentMethod) => {
//   return await apiRequest('get', `/market/buy-quote`, null, {
//     params: { tokenSymbol, amount, paymentMethod }
//   });
// };

// export const createBuyOrder = async (vaultId, tokenSymbol, amount, paymentMethod, paymentDetails) => {
//   return await apiRequest('post', `/vault/${vaultId}/buy`, {
//     tokenSymbol,
//     amount,
//     paymentMethod,
//     paymentDetails
//   });
// };

// // Export default for convenience
// export default {
//   initializeWeb3,
//   loginUser,
//   registerUser,
//   verifyEmail,
//   resetPassword,
//   changePassword,
//   createWallet,
//   getWalletBalance,
//   getWalletTokens,
//   getWalletTransactions,
//   createVault,
//   getVault,
//   getVaultParties,
//   addVaultParty,
//   removeVaultParty,
//   createTransaction,
//   approveTransaction,
//   executeTransaction,
//   getTokenPrice,
//   getExchangeRates,
//   getSellQuote,
//   createSellOrder,
//   approveSellOrder,
//   executeSellOrder,
//   getBuyQuote,
//   createBuyOrder
// };