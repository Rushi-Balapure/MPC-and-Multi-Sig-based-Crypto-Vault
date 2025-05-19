// src/pages/Auth.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";
import Button from '../components/common/Button';
import { signIn, signUp, confirmRegistration } from '../utils/cognitoAuth';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  const [isLogin, setIsLogin] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newPasswordRequired, setNewPasswordRequired] = useState(false);
  const [cognitoUser, setCognitoUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    confirmationCode: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (newPasswordRequired) {
      if (!formData.newPassword || formData.newPassword.length < 8) {
        setError("New password must be at least 8 characters");
        return false;
      }
      return true;
    }
    
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return false;
    }
    
    if (!isLogin && !showConfirmation) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
    }
    
    if (showConfirmation && !formData.confirmationCode) {
      setError("Confirmation code is required");
      return false;
    }
    
    return true;
  };

  const handleCompleteNewPassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Complete the new password challenge
      await new Promise((resolve, reject) => {
        cognitoUser.completeNewPasswordChallenge(
          formData.newPassword,
          {},
          {
            onSuccess: (result) => {
              resolve(result);
            },
            onFailure: (err) => {
              reject(err);
            }
          }
        );
      });
      
      // After setting new password, get the session
      const session = await new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(session);
        });
      });
      
      // Extract token and login
      const idToken = session.getIdToken().getJwtToken();
      const userData = { email: formData.email };
      login(idToken, userData);
      navigate('/');
    } catch (err) {
      console.error('New password error:', err);
      setError(err.message || 'Failed to set new password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Handle confirmation code submission
      if (showConfirmation) {
        await confirmRegistration(signupEmail, formData.confirmationCode);
        // After confirmation, sign in automatically
        const result = await signIn(signupEmail, formData.password);
        
        if (result.challengeName === 'NEW_PASSWORD_REQUIRED') {
          // Handle new password required challenge
          setCognitoUser(result.cognitoUser);
          setNewPasswordRequired(true);
          return;
        }
        
        const idToken = result.getIdToken().getJwtToken();
        const userData = { email: signupEmail };
        login(idToken, userData);
        navigate('/');
        return;
      }
      
      if (isLogin) {
        // Sign in using Cognito
        const result = await signIn(formData.email, formData.password);
        
        if (result.challengeName === 'NEW_PASSWORD_REQUIRED') {
          // Handle new password required challenge
          setCognitoUser(result.cognitoUser);
          setNewPasswordRequired(true);
          return;
        }
        
        // Extract tokens and user data from Cognito result
        const idToken = result.getIdToken().getJwtToken();
        const userData = { email: formData.email };
        
        // Use context login for storing tokens and user data
        login(idToken, userData);
        navigate('/'); // navigate to dashboard
      } else {
        // Sign up using Cognito - email is both the username and email attribute
        await signUp(formData.email, formData.password, formData.email);
        setSignupEmail(formData.email);
        setShowConfirmation(true);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setShowConfirmation(false);
    setNewPasswordRequired(false);
    setError('');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">CryptoVault</h1>
          <p className="text-gray-400">
            {newPasswordRequired ? 'Set a new password' : 
             isLogin ? 'Sign in to access your vault' : 
             showConfirmation ? 'Confirm your account' : 'Create a new vault account'}
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">
            {newPasswordRequired ? 'Set New Password' :
             isLogin ? 'Login' : 
             showConfirmation ? 'Confirm Registration' : 'Sign Up'}
          </h2>
          
          {newPasswordRequired ? (
            <form onSubmit={handleCompleteNewPassword}>
              <div className="mb-4">
                <p className="text-gray-300 mb-4">
                  Your account requires a password reset. Please set a new password.
                </p>
                <label className="block text-white mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              
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
                  {isLoading ? 'Please wait...' : 'Set New Password'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              {showConfirmation ? (
                <div className="mb-4">
                  <p className="text-gray-300 mb-4">
                    We've sent a confirmation code to your email. Please enter it below to verify your account.
                  </p>
                  <label className="block text-white mb-2">Confirmation Code</label>
                  <input
                    type="text"
                    name="confirmationCode"
                    value={formData.confirmationCode}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter confirmation code"
                  />
                </div>
              ) : (
                <>
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
                </>
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
                  {isLoading ? 'Please wait...' : 
                    isLogin ? 'Login' : 
                    showConfirmation ? 'Verify Account' : 'Create Account'}
                </Button>
              </div>
            </form>
          )}
          
          {!showConfirmation && !newPasswordRequired && (
            <div className="mt-4 text-center">
              <button
                onClick={toggleAuthMode}
                className="text-blue-400 hover:text-blue-300 text-sm transition"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
          )}
          
          {isLogin && !newPasswordRequired && (
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