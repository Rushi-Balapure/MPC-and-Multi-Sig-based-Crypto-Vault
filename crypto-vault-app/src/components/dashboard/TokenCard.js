import React from 'react';

const TokenCard = ({ icon, name, price, priceUp }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex items-center">
      <div className="rounded-full bg-white p-1 mr-4">
        <img src={icon} alt={name} className="w-10 h-10" />
      </div>
      <div>
        <h3 className="text-white text-lg">{name}</h3>
        <div className="flex items-center">
          <span className="text-white font-medium">${price}</span>
          <span className={`ml-2 ${priceUp ? 'text-green-400' : 'text-red-400'}`}>
            {priceUp ? '↗' : '↘'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;