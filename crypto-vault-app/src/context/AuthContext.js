// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getCurrentUser,
  getSession,
  signOut as cognitoSignOut
} from "../utils/cognitoAuth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAndRefreshSession = async () => {
    try {
      const cognitoUser = getCurrentUser();
      if (!cognitoUser) {
        console.log("No user found");
        setIsLoggedIn(false);
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      console.log("Cognito User found:", cognitoUser);

      // Attempt to get session
      cognitoUser.getSession((err, session) => {
        if (err || !session.isValid()) {
          console.log("Session invalid or error:", err);
          const refreshToken = session?.getRefreshToken();

          if (refreshToken) {
            // Try refreshing session manually
            cognitoUser.refreshSession(refreshToken, (err, newSession) => {
              if (err) {
                console.error("Error refreshing session:", err);
                logout();
                setIsLoading(false);
              } else {
                const idToken = newSession.getIdToken().getJwtToken();
                setToken(idToken);
                fetchAttributesAndSet(cognitoUser, idToken);
              }
            });
          } else {
            console.warn("No refresh token available.");
            logout();
            setIsLoading(false);
          }
        } else {
          const idToken = session.getIdToken().getJwtToken();
          setToken(idToken);
          fetchAttributesAndSet(cognitoUser, idToken);
        }
      });
    } catch (error) {
      console.error("Unexpected session error:", error);
      logout();
      setIsLoading(false);
    }
  };

  const fetchAttributesAndSet = (cognitoUser, idToken) => {
    cognitoUser.getUserAttributes((err, attributes) => {
      if (err) {
        console.error("Error fetching user attributes:", err);
        setIsLoading(false);
        return;
      }

      const userData = {};
      attributes.forEach(attr => {
        userData[attr.getName()] = attr.getValue();
      });

      setUser(userData);
      setIsLoggedIn(true);
      setIsLoading(false);
    });
  };

  const logout = () => {
    try {
      cognitoSignOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  const login = (idToken, userData) => {
    setToken(idToken);
    setUser(userData);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    checkAndRefreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoggedIn,
        isLoading,
        login,
        logout,
        checkAndRefreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
export default AuthProvider;
