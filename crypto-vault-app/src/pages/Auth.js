// src/pages/Auth.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";
import Button from '../components/common/Button';
import { signIn, signUp, confirmRegistration } from '../utils/cognitoAuth';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Handle session errors passed from PrivateRoute
  useEffect(() => {
    const sessionError = location.state?.error;
    if (sessionError) {
      setError(sessionError);
      // Clear the error from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
      await login(idToken, userData);
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
        await login(idToken, userData);
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
        await login(idToken, userData);
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
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      confirmationCode: '',
      newPassword: ''
    });
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
        
        <div className="bg-gray-800 rounded-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={newPasswordRequired ? handleCompleteNewPassword : handleSubmit}>
            {!showConfirmation && !newPasswordRequired && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    placeholder="Enter your password"
                  />
                </div>
                
                {!isLogin && (
                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                      placeholder="Confirm your password"
                    />
                  </div>
                )}
              </div>
            )}
            
            {showConfirmation && (
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="confirmationCode">
                  Confirmation Code
                </label>
                <input
                  type="text"
                  id="confirmationCode"
                  name="confirmationCode"
                  value={formData.confirmationCode}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Enter confirmation code"
                />
                <p className="mt-2 text-sm text-gray-400">
                  Please check your email for the confirmation code.
                </p>
              </div>
            )}
            
            {newPasswordRequired && (
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Enter new password"
                />
                <p className="mt-2 text-sm text-gray-400">
                  Please set a new password for your account.
                </p>
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