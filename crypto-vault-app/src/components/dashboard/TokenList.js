import React, { useState } from 'react';
import TokenCard from './TokenCard';

// Import crypto icons
import bitcoinIcon from '../../assets/images/cryptocurrency-icons/bitcoin.svg';
import ethereumIcon from '../../assets/images/cryptocurrency-icons/ethereum.svg';
import bnbIcon from '../../assets/images/cryptocurrency-icons/bnb.svg';
import usdcIcon from '../../assets/images/cryptocurrency-icons/usdc.svg';
import tetherIcon from '../../assets/images/cryptocurrency-icons/tether.svg';
import polygonIcon from '../../assets/images/cryptocurrency-icons/polygon.svg';

const TokenList = () => {
  const [activeTab, setActiveTab] = useState('Tokens');
  
  const tokens = [
    { icon: bitcoinIcon, name: 'Bitcoin', price: '85,087.90', priceUp: true },
    { icon: ethereumIcon, name: 'Ethereum', price: '1,610.69', priceUp: true },
    { icon: bnbIcon, name: 'BNB', price: '594.44', priceUp: true },
    { icon: usdcIcon, name: 'USDC', price: '1.00', priceUp: true },
    { icon: tetherIcon, name: 'Tether', price: '1.00', priceUp: false },
    { icon: polygonIcon, name: 'Polygon', price: '0.19', priceUp: true },
  ];

  return (
    <div className="mt-8">
      <div className="border-b border-gray-700 mb-4">
        <div className="flex">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'Tokens' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('Tokens')}
          >
            Tokens
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'NFTs' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('NFTs')}
          >
            NFTs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {tokens.map((token, index) => (
          <TokenCard
            key={index}
            icon={token.icon}
            name={token.name}
            price={token.price}
            priceUp={token.priceUp}
          />
        ))}
      </div>
    </div>
  );
};

export default TokenList;
