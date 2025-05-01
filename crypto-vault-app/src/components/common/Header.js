import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfileClick = () => {
    if (location.pathname === '/profile') {
      navigate('/');
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="flex justify-between items-center mb-4 px-4 py-3">
      <div className="ml-auto cursor-pointer" onClick={handleProfileClick}>
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Header;
