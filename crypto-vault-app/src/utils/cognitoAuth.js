// // src/utils/cognitoAuth.js
// import {
//   CognitoUserPool,
//   CognitoUser,
//   AuthenticationDetails,
//   CognitoUserAttribute
// } from 'amazon-cognito-identity-js';

// // Replace these with your Cognito User Pool ID and App Client ID
// const poolData = {
//   UserPoolId: 'ap-south-1_tyCJFcHdz',
//   ClientId: 'p712os7uhebeq75kg4377v2p9',
// };

// const userPool = new CognitoUserPool(poolData);

// /**
//  * Sign up a new user in Cognito
//  * @param {Object} params - User registration parameters
//  * @param {string} params.email - User's email address
//  * @param {string} params.password - User's password
//  * @param {string} params.name - User's full name
//  * @returns {Promise} - Resolves with registration result or rejects with error
//  */
// export function signUp({ email, password, name }) {
//   return new Promise((resolve, reject) => {
//     // Create attribute list
//     const attributeList = [
//       {
//         Name: 'email',
//         Value: email,
//       },
//       {
//         Name: 'name',
//         Value: name,
//       },
//     ].map(attr => new CognitoUserAttribute(attr));

//     userPool.signUp(email, password, attributeList, null, (err, result) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// }

// /**
//  * Sign in an existing user
//  * @param {Object} params - User sign in parameters
//  * @param {string} params.email - User's email address
//  * @param {string} params.password - User's password
//  * @returns {Promise} - Resolves with auth result (containing tokens) or rejects with error
//  */
// export function signIn({ email, password }) {
//   return new Promise((resolve, reject) => {
//     const user = new CognitoUser({
//       Username: email,
//       Pool: userPool,
//     });
    
//     const authDetails = new AuthenticationDetails({
//       Username: email,
//       Password: password,
//     });

//     user.authenticateUser(authDetails, {
//       onSuccess: (result) => {
//         resolve(result);
//       },
//       onFailure: (err) => {
//         reject(err);
//       },
//     });
//   });
// }

// /**
//  * Get the current authenticated user if any
//  * @returns {CognitoUser|null} - Returns the current Cognito user or null
//  */
// export function getCurrentUser() {
//   return userPool.getCurrentUser();
// }

// /**
//  * Get current session token details
//  * @returns {Promise} - Resolves with session or rejects with error
//  */
// export function getCurrentSession() {
//   return new Promise((resolve, reject) => {
//     const cognitoUser = getCurrentUser();
    
//     if (!cognitoUser) {
//       reject(new Error('No user found'));
//       return;
//     }
    
//     cognitoUser.getSession((err, session) => {
//       if (err) {
//         reject(err);
//         return;
//       }
      
//       resolve(session);
//     });
//   });
// }

// /**
//  * Get JWT tokens from current session
//  * @returns {Promise} - Resolves with object containing tokens or rejects with error
//  */
// export async function getTokens() {
//   try {
//     const session = await getCurrentSession();
    
//     return {
//       idToken: session.getIdToken().getJwtToken(),
//       accessToken: session.getAccessToken().getJwtToken(),
//       refreshToken: session.getRefreshToken().getToken()
//     };
//   } catch (error) {
//     throw error;
//   }
// }

// /**
//  * Sign out the current user
//  */
// export function signOut() {
//   const cognitoUser = getCurrentUser();
  
//   if (cognitoUser) {
//     cognitoUser.signOut();
//   }
// }


// // src/utils/cognitoAuth.js
// import { CognitoUser, CognitoUserPool, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
// import { COGNITO_CONFIG } from './cognitoConfig';
// import crypto from 'crypto';

// // Create a user pool instance
// const userPool = new CognitoUserPool({
//   UserPoolId: COGNITO_CONFIG.USER_POOL_ID,
//   ClientId: COGNITO_CONFIG.CLIENT_ID
// });

// // Calculate SECRET_HASH
// const calculateSecretHash = (username) => {
//   // Only calculate if client secret exists
//   if (!COGNITO_CONFIG.CLIENT_SECRET) return null;
  
//   const message = username + COGNITO_CONFIG.CLIENT_ID;
//   const hmac = crypto.createHmac('SHA256', COGNITO_CONFIG.CLIENT_SECRET);
//   hmac.update(message);
//   return hmac.digest('base64');
// };

// // Get current user from storage
// export const getCurrentUser = () => {
//   return userPool.getCurrentUser();
// };

// // Sign up new user
// export const signUp = (username, password, email) => {
//   return new Promise((resolve, reject) => {
//     // Prepare attributes
//     const attributeList = [
//       new CognitoUserAttribute({
//         Name: 'email',
//         Value: email
//       })
//     ];

//     const secretHash = calculateSecretHash(username);
//     const signUpParams = secretHash ? { SECRET_HASH: secretHash } : null;
    
//     userPool.signUp(
//       username, 
//       password, 
//       attributeList, 
//       null, 
//       (err, result) => {
//         if (err) {
//           reject(err);
//           return;
//         }
//         resolve(result.user);
//       },
//       signUpParams
//     );
//   });
// };

// // Sign in user
// export const signIn = (username, password) => {
//   return new Promise((resolve, reject) => {
//     const user = new CognitoUser({
//       Username: username,
//       Pool: userPool
//     });

//     // Authentication parameters
//     const authenticationData = {
//       Username: username,
//       Password: password
//     };
    
//     // Add SECRET_HASH if client secret exists
//     const secretHash = calculateSecretHash(username);
//     if (secretHash) {
//       authenticationData.SECRET_HASH = secretHash;
//     }

//     const authDetails = new AuthenticationDetails(authenticationData);

//     user.authenticateUser(authDetails, {
//       onSuccess: (result) => {
//         resolve(result);
//       },
//       onFailure: (err) => {
//         reject(err);
//       }
//     });
//   });
// };

// // Sign out
// export const signOut = () => {
//   const user = userPool.getCurrentUser();
//   if (user) {
//     user.signOut();
//   }
// };

// // Confirm registration with code
// export const confirmRegistration = (username, code) => {
//   return new Promise((resolve, reject) => {
//     const user = new CognitoUser({
//       Username: username,
//       Pool: userPool
//     });

//     // Add SECRET_HASH property to the CognitoUser if needed
//     const secretHash = calculateSecretHash(username);
//     if (secretHash) {
//       user.setClientSecret(COGNITO_CONFIG.CLIENT_SECRET);
//     }

//     user.confirmRegistration(code, true, (err, result) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//       resolve(result);
//     });
//   });
// };

// // Request password reset
// export const forgotPassword = (username) => {
//   return new Promise((resolve, reject) => {
//     const user = new CognitoUser({
//       Username: username,
//       Pool: userPool
//     });

//     // Add SECRET_HASH if client has a secret  
//     if (COGNITO_CONFIG.CLIENT_SECRET) {
//       user.setClientSecret(COGNITO_CONFIG.CLIENT_SECRET);
//     }

//     user.forgotPassword({
//       onSuccess: (data) => {
//         resolve(data);
//       },
//       onFailure: (err) => {
//         reject(err);
//       }
//     });
//   });
// };

// // Confirm new password after reset
// export const confirmPassword = (username, code, newPassword) => {
//   return new Promise((resolve, reject) => {
//     const user = new CognitoUser({
//       Username: username,
//       Pool: userPool
//     });

//     // Add SECRET_HASH if client has a secret
//     if (COGNITO_CONFIG.CLIENT_SECRET) {
//       user.setClientSecret(COGNITO_CONFIG.CLIENT_SECRET);
//     }

//     user.confirmPassword(code, newPassword, {
//       onSuccess: () => {
//         resolve();
//       },
//       onFailure: (err) => {
//         reject(err);
//       }
//     });
//   });
// };

// // Get session for current user (useful for AuthContext)
// export const getSession = () => {
//   return new Promise((resolve, reject) => {
//     const cognitoUser = getCurrentUser();
    
//     if (!cognitoUser) {
//       reject(new Error('No user found'));
//       return;
//     }
    
//     cognitoUser.getSession((err, session) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//       resolve(session);
//     });
//   });
// };


//////////////////// NEW CODE 19-5-2025   2.50PM

// src/utils/cognitoAuth.js 
import {
  CognitoUser,
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import { COGNITO_CONFIG } from './cognitoConfig';

// Create a user pool instance
const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.USER_POOL_ID,
  ClientId: COGNITO_CONFIG.CLIENT_ID
});

// Get current user from local storage
export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

// Sign up a new user - email is used as both username and email attribute
export const signUp = (email, password, emailAttr) => {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: emailAttr
      })
    ];

    userPool.signUp(
      email,
      password,
      attributeList,
      null,
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result.user);
      }
    );
  });
};

// Sign in existing user
export const signIn = (email, password) => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result);
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // This is called when the user is required to change their password
        // We'll resolve with a special object indicating this challenge
        resolve({
          cognitoUser,
          userAttributes,
          requiredAttributes,
          challengeName: 'NEW_PASSWORD_REQUIRED'
        });
      }
    });
  });
};

// Sign out current user
export const signOut = () => {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
};

// Confirm registration using confirmation code
export const confirmRegistration = (email, code) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool
    });
    
    user.confirmRegistration(code, true, function(err, result) {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

// Request password reset
export const forgotPassword = (email) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool
    });
    
    user.forgotPassword({
      onSuccess: (data) => {
        resolve(data);
      },
      onFailure: (err) => {
        reject(err);
      },
      inputVerificationCode: (data) => {
        resolve(data);
      }
    });
  });
};

// Confirm new password after reset
export const confirmPassword = (email, code, newPassword) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool
    });
    
    user.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
};

// Get user session
export const getSession = () => {
  return new Promise((resolve, reject) => {
    const user = getCurrentUser();
    if (!user) {
      reject(new Error('No user found'));
      return;
    }
    
    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(session);
    });
  });
};