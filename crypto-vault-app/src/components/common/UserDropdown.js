// src/components/common/UserDropdown.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext'; // Changed from VaultContext to AuthContext

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext(); // Using AuthContext instead of VaultContext

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout(); // Call the logout function from AuthContext
      navigate('/auth'); // Redirect to auth/login page after logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to auth page even if logout fails
      navigate('/auth');
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Get user name from AuthContext user object
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.given_name) return user.given_name;
    if (user?.nickname) return user.nickname;
    return "User";
  };

  // Get user email from AuthContext user object
  const getUserEmail = () => {
    if (user?.email) return user.email;
    return "No email";
  };

  const userName = getUserName();
  const userEmail = getUserEmail();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Icon */}
      <div 
        className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 cursor-pointer transition-colors duration-200"
        onClick={toggleDropdown}
      >
        <span className="text-sm font-semibold">
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center text-white mr-3">
                <span className="text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Profile Option */}
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Profile
            </button>

            {/* Logout Option */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;