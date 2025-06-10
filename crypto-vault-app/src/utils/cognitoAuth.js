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