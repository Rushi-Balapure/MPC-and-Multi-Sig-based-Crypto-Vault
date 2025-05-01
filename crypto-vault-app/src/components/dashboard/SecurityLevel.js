import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';

const SecurityLevel = () => {
  return (
    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md">
      <div className="flex items-center">
        <FontAwesomeIcon icon={faShieldAlt} className="text-white mr-2" />
        <span className="text-white">Security Level: 1 of 9</span>
      </div>
      <button className="text-yellow-500 hover:text-yellow-400">
        Boost Security
      </button>
    </div>
  );
};

export default SecurityLevel;