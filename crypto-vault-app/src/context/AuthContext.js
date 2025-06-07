// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  getCurrentUser, 
  getSession, 
  signIn as cognitoSignIn,
  signOut as cognitoSignOut
} from "../utils/cognitoAuth";

// Create the context
export const AuthContext = createContext();

// Create the provider
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  // Check and refresh session
  const checkAndRefreshSession = async () => {
    try {
      setIsLoading(true);
      setSessionError(null);

      const cognitoUser = getCurrentUser();
      if (!cognitoUser) {
        throw new Error('No user found');
      }

      const session = await getSession();
      if (!session.isValid()) {
        // Session is invalid, attempt to refresh
        await new Promise((resolve, reject) => {
          cognitoUser.refreshSession(session.getRefreshToken(), (err, newSession) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(newSession);
          });
        });
      }

      // Get user attributes
      const userData = await new Promise((resolve, reject) => {
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
            return;
          }
          const userObj = {};
          attributes.forEach(attr => {
            userObj[attr.getName()] = attr.getValue();
          });
          resolve(userObj);
        });
      });

      // Update state with valid session data
      setToken(session.getIdToken().getJwtToken());
      setUser(userData);
      setIsLoggedIn(true);
      
      // Store session data
      localStorage.setItem("vault_jwt", session.getIdToken().getJwtToken());
      localStorage.setItem("vault_user", JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Session check/refresh error:', error);
      setSessionError(error.message);
      // Clear invalid session data
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem("vault_jwt");
      localStorage.removeItem("vault_user");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check session on mount and set up refresh interval
  useEffect(() => {
    checkAndRefreshSession();

    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(checkAndRefreshSession, 5 * 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(sessionCheckInterval);
  }, []);

  // Modified login function to accept token and userData directly
  const login = async (idToken, userData) => {
    try {
      setToken(idToken);
      setUser(userData);
      setIsLoggedIn(true);
      
      localStorage.setItem("vault_jwt", idToken);
      localStorage.setItem("vault_user", JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Enhanced logout function
  const logout = async () => {
    try {
      // Sign out from Cognito
      await cognitoSignOut();
      
      // Clear state and localStorage
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem("vault_jwt");
      localStorage.removeItem("vault_user");
      
      // Clear any other app-specific storage
      localStorage.removeItem("wallet");
      sessionStorage.clear();
      
      // Force reload to clear any remaining state
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear everything even if there's an error
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        user, 
        isLoggedIn, 
        isLoading,
        sessionError,
        login, 
        logout,
        checkAndRefreshSession // Expose the refresh function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

export default AuthProvider;