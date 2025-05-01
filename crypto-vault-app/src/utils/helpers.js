// src/utils/helpers.js

/**
 * Formats a numeric amount with commas as thousands separators
 * and limits decimal places
 * 
 * @param {number|string} amount - The amount to format
 * @param {number} decimals - Number of decimal places to display (default: 2)
 * @returns {string} - Formatted amount string
 */
export const formatAmount = (amount, decimals = 2) => {
    // Handle empty or undefined values
    if (amount === undefined || amount === null || amount === '') {
      return '0.00';
    }
    
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number
    if (isNaN(numAmount)) {
      return '0.00';
    }
    
    // Format with commas and specified decimal places
    return numAmount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  /**
   * Shortens an address for display (e.g., 0x1234...5678)
   * 
   * @param {string} address - The full address
   * @param {number} startChars - Number of characters to show at start
   * @param {number} endChars - Number of characters to show at end
   * @returns {string} - Shortened address
   */
  export const shortenAddress = (address, startChars = 6, endChars = 4) => {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };
  
  /**
   * Calculates time elapsed since a given timestamp in human-readable format
   * 
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} - Human readable time (e.g., "5 minutes ago")
   */
  export const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    // Time intervals in seconds
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    // Find the appropriate interval
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    
    return 'Just now';
  };
  
  /**
   * Validates a cryptocurrency address format
   * 
   * @param {string} address - The address to validate
   * @param {string} type - The cryptocurrency type (eth, btc, etc.)
   * @returns {boolean} - Whether the address is valid
   */
  export const isValidAddress = (address, type = 'eth') => {
    if (!address) return false;
    
    // Basic validation patterns
    const patterns = {
      eth: /^0x[a-fA-F0-9]{40}$/,
      btc: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      usdc: /^0x[a-fA-F0-9]{40}$/  // USDC is an ERC-20 token (Ethereum address)
    };
    
    const pattern = patterns[type.toLowerCase()];
    return pattern ? pattern.test(address) : false;
  };