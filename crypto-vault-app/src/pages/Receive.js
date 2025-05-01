// src/pages/Receive.js
import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import Button from '../components/common/Button';
import { QRCodeSVG } from 'qrcode.react';

const Receive = () => {
  const { 
    user,
    teams, 
    activeTeam, 
    teamAssets, 
    selectTeam, 
    transactionHistory,
  } = useVault();
  
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  
  // Generate a deposit address for the team
  // This would normally come from your backend
  const generateDepositAddress = (teamId, currency) => {
    // In a real implementation, this would be unique per team and currency
    // For now, create a mock address that's consistent for the same team+currency
    const prefix = currency === 'BTC' ? 'bc1' : '0x';
    const hash = `${teamId}${currency}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16);
    return `${prefix}${hash.padEnd(40, '0')}`;
  };
  
  // Set default team when teams are loaded
  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id);
      selectTeam(teams[0].id);
    }
  }, [teams, selectedTeam, selectTeam]);
  
  // Handle team selection change
  const handleTeamChange = (e) => {
    const teamId = e.target.value;
    setSelectedTeam(teamId);
    selectTeam(teamId);
  };
  
  // Handle currency selection change
  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };
  
  // Get deposit address for current team and currency
  const getDepositAddress = () => {
    if (!selectedTeam) return '';
    return generateDepositAddress(selectedTeam, selectedCurrency);
  };
  
  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    const address = getDepositAddress();
    if (address) {
      navigator.clipboard.writeText(address);
      alert('Address copied to clipboard!');
    }
  };
  
  // Get recent deposit transactions
  const getRecentDeposits = () => {
    return transactionHistory.filter(tx => 
      tx.type === 'RECEIVE' && 
      tx.asset === selectedCurrency
    ).slice(0, 5); // Show most recent 5
  };
  
  // Get the selected team name
  const getSelectedTeamName = () => {
    const team = teams.find(t => t.id === selectedTeam);
    return team ? team.name : '';
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold text-white mb-6">Receive Crypto</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg text-white mb-4">Deposit Settings</h2>
        
        <div className="mb-4">
          <label className="block text-white mb-2">Select Team Vault</label>
          <select 
            className="w-full bg-gray-700 text-white py-2 px-4 rounded-md"
            value={selectedTeam}
            onChange={handleTeamChange}
          >
            {teams && teams.length > 0 ? (
              teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.memberCount} members)
                </option>
              ))
            ) : (
              <option value="">No teams available</option>
            )}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-white mb-2">Select Currency</label>
          <select 
            className="w-full bg-gray-700 text-white py-2 px-4 rounded-md"
            value={selectedCurrency}
            onChange={handleCurrencyChange}
          >
            {teamAssets && teamAssets.length > 0 ? (
              teamAssets.map(asset => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name || asset.symbol} ({asset.symbol})
                </option>
              ))
            ) : (
              <>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BTC">Bitcoin (BTC)</option>
              </>
            )}
          </select>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg text-white mb-4">
          {getSelectedTeamName()} {selectedCurrency} Deposit Address
        </h2>
        
        <div className="flex justify-center mb-6">
          {selectedTeam ? (
            <div className="bg-white p-4 rounded-md">
              <QRCodeSVG value={getDepositAddress()} size={200} />
            </div>
          ) : (
            <div className="bg-gray-700 text-white p-4 rounded-md">
              Please select a team
            </div>
          )}
        </div>
        
        {selectedTeam && (
          <>
            <div className="bg-gray-700 text-white p-3 rounded-md mb-4 font-mono text-sm text-center overflow-auto">
              {getDepositAddress()}
            </div>
            
            <Button 
              variant="primary" 
              fullWidth 
              onClick={copyAddressToClipboard}
            >
              Copy Address
            </Button>
            
            <div className="mt-4 text-yellow-500 text-sm">
              <p className="mb-2">⚠️ Important:</p>
              <ul className="list-disc pl-5 text-gray-400">
                <li className="mb-1">Only send {selectedCurrency} to this address.</li>
                <li className="mb-1">This is a multi-party vault address. Funds will be visible to all team members.</li>
                <li>All deposits are recorded on the blockchain and cannot be reversed.</li>
              </ul>
            </div>
          </>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg text-white mb-4">Recent Deposits</h2>
        
        <div className="bg-gray-700 rounded-md">
          {getRecentDeposits().length > 0 ? (
            getRecentDeposits().map((deposit, index) => (
              <div key={index} className="p-3 border-b border-gray-600 last:border-b-0">
                <div className="flex justify-between">
                  <span className="text-green-400">{deposit.amount} {deposit.asset}</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(deposit.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  Transaction ID: {deposit.id.substring(0, 8)}...
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-400 text-center">
              No recent deposits found for {selectedCurrency}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button 
            variant="outline"
            onClick={() => alert("This would link to a more detailed transaction history page")}
          >
            View All Transactions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Receive;