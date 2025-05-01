import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

const Balance = () => {
  return (
    <div className="mt-6">
      <h2 className="text-lg text-white">My Balance</h2>
      <div className="flex items-center">
        <h1 className="text-4xl text-white font-bold">$0.00</h1>
        <button className="ml-2 text-gray-400">
          <FontAwesomeIcon icon={faEye} />
        </button>
      </div>
    </div>
  );
};

export default Balance;