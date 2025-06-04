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

  // Check for existing Cognito session on load
  useEffect(() => {
  const checkCognitoSession = async () => {
    try {
      setIsLoading(true);

      // First, check with the Express backend if the session is valid
      const response = await fetch("http://localhost:3001/api/session", {
        method: "GET",
        credentials: "include", // important: sends cookie with request
      });

      if (response.ok) {
        const { user: sessionUser } = await response.json();

        // Use localStorage for fallback token and enrich user
        const savedToken = localStorage.getItem("vault_jwt");
        const savedUser = JSON.parse(localStorage.getItem("vault_user") || "null");

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          setIsLoggedIn(true);
        } else if (sessionUser) {
          setUser(sessionUser);
          setIsLoggedIn(true);
        }
      } else {
        // Server session invalid, clear localStorage
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem("vault_jwt");
        localStorage.removeItem("vault_user");
      }
    } catch (error) {
      console.error("AuthContext: session check error", error);
    } finally {
      setIsLoading(false);
    }
  };

  checkCognitoSession();
}, []);

  // Modified login function to accept token and userData directly
  const login = (idToken, userData) => {
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

  // Logout function
  const logout = () => {
    try {
      // Sign out from Cognito
      cognitoSignOut();
      
      // Clear state and localStorage
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem("vault_jwt");
      localStorage.removeItem("vault_user");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        user, 
        isLoggedIn, 
        isLoading, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);
export default AuthProvider;