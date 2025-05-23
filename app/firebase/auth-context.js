// app/firebase/auth-context.js (fixed version)
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { useRouter } from 'next/navigation';

// Create the authentication context
const AuthContext = createContext();

// Create a provider for components to consume and subscribe to changes
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminSetupComplete, setAdminSetupComplete] = useState(null);
  const router = useRouter();

  // Register a new user with email, password, and role
  const registerUser = async (email, password, userData) => {
    try {
      // Only allow 'parent' role for registration unless admin setup
      if (userData.role === 'admin' && !(userData.isSystemSetup && !adminSetupComplete)) {
        throw new Error('Admin accounts can only be created by existing administrators');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'parent',
        createdAt: new Date().toISOString()
      });

      // If this is the initial admin setup, mark as complete
      if (userData.isSystemSetup && !adminSetupComplete) {
        await setDoc(doc(db, 'system', 'admin_setup'), {
          initialized: true,
          initialAdminId: user.uid,
          createdAt: new Date().toISOString()
        });
        setAdminSetupComplete(true);
      }

      return { user };
    } catch (error) {
      return { error };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      }

      // Update last login timestamp
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      });

      return { user };
    } catch (error) {
      return { error };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (accessCode = null) => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // This is a new user
        // Only allow parent role for Google sign-in
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName: user.displayName ? user.displayName.split(' ')[0] : '',
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
          role: 'parent',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        setUserRole('parent');
      } else {
        // Existing user, get their role and update last login
        setUserRole(userDoc.data().role);
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString()
        });
      }

      return { user };
    } catch (error) {
      return { error };
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
      return { success: true };
    } catch (error) {
      return { error };
    }
  };

  // Check if admin setup is complete
  useEffect(() => {
    const checkAdminSetup = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'system', 'admin_setup'));
        setAdminSetupComplete(adminDoc.exists() && adminDoc.data().initialized === true);
      } catch (error) {
        console.error('Error checking admin setup:', error);
        // Default to null rather than false to indicate we don't know yet
        setAdminSetupComplete(null);
      }
    };

    checkAdminSetup();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Context value
  const value = {
    user,
    userRole,
    loading,
    adminSetupComplete,
    registerUser,
    signIn,
    signInWithGoogle,
    logOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};