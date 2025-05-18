// src/pages/Auth.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import Button from '../components/common/Button';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useVault();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return false;
    }
    
    if (!isLogin) {
      if (!formData.name) {
        setError("Name is required");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Handle login
        await login({ email: formData.email, password: formData.password });
        navigate('/');
      } else {
        // For signup, this would call an API endpoint
        // For now, just simulate successful signup then login
        console.log("Sign up with:", formData);
        setTimeout(async () => {
          await login({ email: formData.email, password: formData.password });
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">CryptoVault</h1>
          <p className="text-gray-400">
            {isLogin ? 'Sign in to access your vault' : 'Create a new vault account'}
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">
            {isLogin ? 'Login' : 'Sign Up'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-white mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-white mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-white mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
            
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-white mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-red-200 text-sm">
                {error}
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                variant="primary" 
                fullWidth 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={toggleAuthMode}
              className="text-blue-400 hover:text-blue-300 text-sm transition"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
          
          {isLogin && (
            <div className="mt-4 text-center">
              <button className="text-gray-400 hover:text-gray-300 text-sm transition">
                Forgot password?
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2025 CryptoVault. All rights reserved.</p>
          <div className="mt-2">
            <a href="#" className="text-gray-500 hover:text-gray-400 mx-2">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-gray-400 mx-2">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;