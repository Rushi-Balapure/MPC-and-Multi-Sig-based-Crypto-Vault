// src/components/Header.js
import React from 'react';
import UserDropdown from '../common/UserDropdown';

const Header = () => {
  return (
    <div className="flex justify-between items-center mb-4 px-4 py-3">
      <div className="ml-auto">
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;
