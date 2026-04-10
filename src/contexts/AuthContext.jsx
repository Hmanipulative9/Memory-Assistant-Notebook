import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with Email/Password
  async function signup(email, password, name, profession) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      profession,
      email,
      createdAt: new Date()
    });
    
    return userCredential;
  }

  // Login with Email/Password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Anonymous Login
  function loginAnonymously() {
    return signInAnonymously(auth);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Even for anonymous, we might want to check or create a minimal doc
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setCurrentUser({ ...user, profile: userDoc.data() });
        } else {
          // If anonymous user logs in first time, create a default profile
          const anonymousProfile = { name: 'Anonymous User', profession: 'Learner', isAnonymous: true };
          await setDoc(userDocRef, anonymousProfile);
          setCurrentUser({ ...user, profile: anonymousProfile });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginAnonymously,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
