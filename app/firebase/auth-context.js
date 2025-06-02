// app/firebase/auth-context.js (Fixed Parent Registration)
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
      console.log('🔐 Creating Firebase Auth user...');
      
      // Only allow 'parent' role for registration unless admin setup
      if (userData.role === 'admin' && !(userData.isSystemSetup && !adminSetupComplete)) {
        throw new Error('Admin accounts can only be created by existing administrators');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase Auth user created:', user.uid);
      console.log('💾 Saving user data to Firestore...');

      // Prepare comprehensive user data
      const userDocData = {
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'parent',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        
        // Parent-specific fields
        ...(userData.role === 'parent' && {
          accessCode: userData.accessCode,
          childId: userData.childId,
          linkedChildIds: userData.linkedChildIds || [],
          parentRegistered: true,
          registrationCompletedAt: new Date().toISOString()
        }),
        
        // Admin-specific fields
        ...(userData.role === 'admin' && {
          isOwner: userData.isOwner || false,
          position: userData.position || ''
        })
      };

      console.log('📄 User document data:', userDocData);

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), userDocData);
      
      console.log('✅ User document saved successfully');

      // If this is the initial admin setup, mark as complete
      if (userData.isSystemSetup && !adminSetupComplete) {
        await setDoc(doc(db, 'system', 'admin_setup'), {
          initialized: true,
          initialAdminId: user.uid,
          createdAt: new Date().toISOString()
        });
        setAdminSetupComplete(true);
        console.log('✅ Admin setup marked as complete');
      }

      return { user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { error };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      console.log('🔐 Signing in user:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ User signed in:', user.uid);

      // Get user role and data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        console.log('📄 User role set:', userData.role);
        
        // Update last login timestamp
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString()
        });
      } else {
        console.warn('⚠️ User document not found in Firestore');
        // Create a basic user document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'parent', // Default role
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        setUserRole('parent');
      }

      return { user };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { error };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (accessCode = null) => {
    try {
      console.log('🔐 Signing in with Google...');
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ Google sign in successful:', user.uid);

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('👤 New Google user, creating profile...');
        
        // This is a new user - only allow parent role for Google sign-in
        const userDocData = {
          uid: user.uid,
          email: user.email,
          firstName: user.displayName ? user.displayName.split(' ')[0] : '',
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
          role: 'parent',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          signInMethod: 'google',
          linkedChildIds: []
        };
        
        await setDoc(doc(db, 'users', user.uid), userDocData);
        setUserRole('parent');
        console.log('✅ New Google user profile created');
      } else {
        // Existing user, get their role and update last login
        const userData = userDoc.data();
        setUserRole(userData.role);
        
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString()
        });
        console.log('✅ Existing Google user signed in, role:', userData.role);
      }

      return { user };
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      return { error };
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      await signOut(auth);
      setUserRole(null);
      setAdminSetupComplete(null);
      router.push('/auth');
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    }
  };

  // Check if admin setup is complete
  useEffect(() => {
    const checkAdminSetup = async () => {
      try {
        console.log('🔍 Checking admin setup status...');
        const adminDoc = await getDoc(doc(db, 'system', 'admin_setup'));
        const isComplete = adminDoc.exists() && adminDoc.data().initialized === true;
        setAdminSetupComplete(isComplete);
        console.log('📊 Admin setup complete:', isComplete);
      } catch (error) {
        console.error('❌ Error checking admin setup:', error);
        // Default to null rather than false to indicate we don't know yet
        setAdminSetupComplete(null);
      }
    };

    checkAdminSetup();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    console.log('👂 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      
      if (user) {
        setUser(user);

        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            console.log('📄 User role loaded:', userData.role);
          } else {
            console.warn('⚠️ User document not found, creating basic profile...');
            // Create basic profile if missing
            const basicUserData = {
              uid: user.uid,
              email: user.email,
              role: 'parent',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', user.uid), basicUserData);
            setUserRole('parent');
          }
        } catch (error) {
          console.error('❌ Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
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