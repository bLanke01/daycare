// app/firebase/auth-context.js - Enhanced with better Google OAuth
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
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
        signInMethods: ['password'], // Track sign-in methods
        
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

      // Check if email is verified
      if (!user.emailVerified) {
        // Sign out the user immediately
        await signOut(auth);
        throw new Error(
          'Please verify your email address before logging in. ' +
          'Check your inbox for the verification email. ' +
          'If you need to resend the verification email, click the link on the login page.'
        );
      }

      // Get user role and data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        console.log('📄 User role set:', userData.role);
        
        // Update last login timestamp and email verification status
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString(),
          emailVerified: true // Update our Firestore record
        });
      } else {
        console.warn('⚠️ User document not found in Firestore');
        // Create a basic user document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'parent', // Default role
          signInMethods: ['password'],
          emailVerified: true,
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

  // Enhanced Google sign-in with role verification
  const signInWithGoogle = async (expectedRole = 'parent') => {
    try {
      console.log('🔐 Signing in with Google for role:', expectedRole);
      
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ Google sign in successful:', user.uid);

      // Check if this is a new user (using additionalUserInfo)
      const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('👤 New Google user, creating profile...');
        
        // For new users, only allow parent role
        if (expectedRole === 'admin') {
          return { 
            error: new Error('Admin accounts cannot be created via Google sign-in. Please contact an administrator.'),
            isNewUser: true 
          };
        }
        
        // Create new user profile
        const userDocData = {
          uid: user.uid,
          email: user.email,
          firstName: user.displayName ? user.displayName.split(' ')[0] : '',
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
          profilePicture: user.photoURL || '',
          role: 'parent', // New Google users are always parents
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          signInMethods: ['google'],
          linkedChildIds: [],
          googleLinked: true,
          googleData: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            linkedAt: new Date().toISOString()
          }
        };
        
        await setDoc(doc(db, 'users', user.uid), userDocData);
        setUserRole('parent');
        console.log('✅ New Google user profile created');
        
        return { 
          user: { ...user, role: 'parent' }, 
          isNewUser: true,
          needsRoleVerification: false
        };
      } else {
        // Existing user
        const userData = userDoc.data();
        console.log('✅ Existing user found with role:', userData.role);
        
        // Check if role matches expected role
        if (userData.role !== expectedRole) {
          console.warn('⚠️ Role mismatch:', userData.role, 'vs expected:', expectedRole);
          return {
            error: new Error(`This Google account is registered as a ${userData.role === 'admin' ? 'Staff/Admin' : 'Parent'}.`),
            user: { ...user, role: userData.role },
            needsRoleVerification: true,
            isNewUser: false
          };
        }
        
        // Update existing user's last login and ensure Google is in sign-in methods
        const signInMethods = userData.signInMethods || [];
        if (!signInMethods.includes('google')) {
          signInMethods.push('google');
        }
        
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString(),
          signInMethods: signInMethods,
          googleLinked: true,
          'googleData.lastSignIn': new Date().toISOString(),
          // Update profile info from Google if missing
          ...((!userData.firstName || !userData.lastName) && user.displayName && {
            firstName: userData.firstName || user.displayName.split(' ')[0] || '',
            lastName: userData.lastName || user.displayName.split(' ').slice(1).join(' ') || '',
          }),
          ...((!userData.profilePicture) && user.photoURL && {
            profilePicture: user.photoURL
          })
        });
        
        setUserRole(userData.role);
        console.log('✅ Existing Google user signed in, role:', userData.role);
        
        return { 
          user: { ...user, role: userData.role }, 
          isNewUser: false,
          needsRoleVerification: false
        };
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      
      // Handle specific Google sign-in errors
      if (error.code === 'auth/popup-closed-by-user') {
        return { error: new Error('Sign-in was cancelled. Please try again.') };
      } else if (error.code === 'auth/popup-blocked') {
        return { error: new Error('Pop-up was blocked. Please allow pop-ups and try again.') };
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        return { error: new Error('An account already exists with this email using a different sign-in method.') };
      }
      
      return { error };
    }
  };

  // Link Google account to existing email/password account
  const linkGoogleAccount = async () => {
    try {
      console.log('🔗 Linking Google account to existing user...');
      
      if (!user) {
        throw new Error('No user signed in');
      }

      const provider = new GoogleAuthProvider();
      const result = await linkWithPopup(user, provider);
      
      console.log('✅ Google account linked successfully');

      // Update user document with Google data
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const signInMethods = userDoc.data().signInMethods || [];
        if (!signInMethods.includes('google')) {
          signInMethods.push('google');
        }
        
        await updateDoc(userDocRef, {
          signInMethods: signInMethods,
          googleLinked: true,
          googleData: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            linkedAt: new Date().toISOString()
          },
          // Update profile info from Google if missing
          ...((!userDoc.data().profilePicture) && result.user.photoURL && {
            profilePicture: result.user.photoURL
          })
        });
      }
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Google account linking error:', error);
      
      if (error.code === 'auth/credential-already-in-use') {
        return { error: new Error('This Google account is already linked to another account.') };
      } else if (error.code === 'auth/email-already-in-use') {
        return { error: new Error('This email is already associated with another account.') };
      }
      
      return { error };
    }
  };

  // Check if user has Google linked
  const hasGoogleLinked = async (userId = null) => {
    try {
      const uid = userId || user?.uid;
      if (!uid) return false;
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.googleLinked === true || (userData.signInMethods || []).includes('google');
      }
      return false;
    } catch (error) {
      console.error('Error checking Google link status:', error);
      return false;
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
              signInMethods: user.providerData.map(p => p.providerId === 'google.com' ? 'google' : 'password'),
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
    linkGoogleAccount,
    hasGoogleLinked,
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