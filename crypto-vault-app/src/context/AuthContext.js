// // src/context/AuthContext.js
// import React, { createContext, useState, useEffect, useContext } from "react";
// import { 
//   getCurrentUser, 
//   getSession, 
//   signIn as cognitoSignIn,
//   signOut as cognitoSignOut
// } from "../utils/cognitoAuth";

// // Create the context
// export const AuthContext = createContext();

// // Create the provider
// export const AuthProvider = ({ children }) => {
//   const [token, setToken] = useState(null);
//   const [user, setUser] = useState(null);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   // Check for existing Cognito session on load
//   useEffect(() => {
//     const checkCognitoSession = async () => {
//       try {
//         setIsLoading(true);
        
//         // Check if there's an active Cognito session
//         const cognitoUser = getCurrentUser();
        
//         if (cognitoUser) {
//           try {
//             const session = await getSession();
            
//             if (session && session.isValid()) {
//               // Get the id token from the session
//               const idToken = session.getIdToken().getJwtToken();
              
//               // Get user attributes
//               cognitoUser.getUserAttributes((err, attributes) => {
//                 if (err) {
//                   console.error("Error getting user attributes:", err);
//                   setIsLoading(false);
//                   return;
//                 }
                
//                 // Create a user object from attributes
//                 const userData = {};
//                 attributes.forEach(attr => {
//                   userData[attr.getName()] = attr.getValue();
//                 });
                
//                 // Set the token and user in state
//                 setToken(idToken);
//                 setUser(userData);
//                 setIsLoggedIn(true);
                
//                 // Store in localStorage as backup
//                 localStorage.setItem("vault_jwt", idToken);
//                 localStorage.setItem("vault_user", JSON.stringify(userData));
                
//                 setIsLoading(false);
//               });
//             } else {
//               // Session exists but is not valid
//               localStorage.removeItem("vault_jwt");
//               localStorage.removeItem("vault_user");
//               setIsLoading(false);
//             }
//           } catch (error) {
//             console.error("Session error:", error);
//             setIsLoading(false);
//           }
//         } else {
//           // No Cognito session, but check localStorage as fallback
//           const savedToken = localStorage.getItem("vault_jwt");
//           const savedUser = JSON.parse(localStorage.getItem("vault_user") || "null");
          
//           if (savedToken) {
//             setToken(savedToken);
//             setUser(savedUser);
//             setIsLoggedIn(true);
//           }
          
//           setIsLoading(false);
//         }
//       } catch (error) {
//         console.error("Authentication error:", error);
//         setIsLoading(false);
//       }
//     };
    
//     checkCognitoSession();
//   }, []);

//   // Modified login function to accept token and userData directly
//   const login = (idToken, userData) => {
//     try {
//       setToken(idToken);
//       setUser(userData);
//       setIsLoggedIn(true);
      
//       localStorage.setItem("vault_jwt", idToken);
//       localStorage.setItem("vault_user", JSON.stringify(userData));
      
//       return true;
//     } catch (error) {
//       console.error("Login error:", error);
//       throw error;
//     }
//   };

//   // Logout function
//   const logout = () => {
//     try {
//       // Sign out from Cognito
//       cognitoSignOut();
      
//       // Clear state and localStorage
//       setToken(null);
//       setUser(null);
//       setIsLoggedIn(false);
//       localStorage.removeItem("vault_jwt");
//       localStorage.removeItem("vault_user");
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   };

//   return (
//     <AuthContext.Provider 
//       value={{ 
//         token, 
//         user, 
//         isLoggedIn, 
//         isLoading, 
//         login, 
//         logout 
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use the auth context
// export const useAuthContext = () => useContext(AuthContext);
// export default AuthProvider;


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
        
        // Check if there's an active Cognito session
        const cognitoUser = getCurrentUser();
        
        if (cognitoUser) {
          try {
            const session = await getSession();
            
            if (session && session.isValid()) {
              // Get the id token from the session
              const idToken = session.getIdToken().getJwtToken();
              
              // Get user attributes
              cognitoUser.getUserAttributes((err, attributes) => {
                if (err) {
                  console.error("Error getting user attributes:", err);
                  setIsLoading(false);
                  return;
                }
                
                // Create a user object from attributes
                const userData = {};
                attributes.forEach(attr => {
                  userData[attr.getName()] = attr.getValue();
                });
                
                // Set the token and user in state
                setToken(idToken);
                setUser(userData);
                setIsLoggedIn(true);
                setIsLoading(false);
              });
            } else {
              // Session exists but is not valid
              setToken(null);
              setUser(null);
              setIsLoggedIn(false);
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Session error:", error);
            setToken(null);
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
          }
        } else {
          // No Cognito session, set logged out
          setToken(null);
          setUser(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
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
      
      // Clear state
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
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
