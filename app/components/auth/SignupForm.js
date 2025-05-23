// Simplified SignupForm.js - Emergency Fix Version
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'parent';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accessCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userType === 'admin') {
      setError('Admin accounts can only be created by existing administrators');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      setDebugInfo('Starting registration...');
      
      const trimmedCode = formData.accessCode.trim().toUpperCase();
      console.log('🚀 Starting simplified registration with code:', trimmedCode);
      
      // Step 1: Create Firebase Auth User FIRST
      setDebugInfo('Creating Firebase Auth user...');
      console.log('📝 Creating auth user for:', formData.email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      console.log('✅ Auth user created:', user.uid);
      setDebugInfo('Auth user created successfully. Creating profile...');
      
      // Step 2: Create User Profile in Firestore
      const userDocData = {
        uid: user.uid,
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'parent',
        accessCode: trimmedCode,
        createdAt: new Date().toISOString(),
        registrationCompleted: true
      };
      
      console.log('💾 Saving user profile to Firestore...');
      await setDoc(doc(db, 'users', user.uid), userDocData);
      console.log('✅ User profile saved');
      setDebugInfo('User profile created. Looking for access code...');
      
      // Step 3: Find Access Code (Simple approach)
      console.log('🔍 Looking for access code:', trimmedCode);
      let foundAccessCode = false;
      let accessCodeData = null;
      
      try {
        // Try to get access code document directly
        const accessCodeDoc = await getDoc(doc(db, 'accessCodes', trimmedCode));
        
        if (accessCodeDoc.exists()) {
          accessCodeData = accessCodeDoc.data();
          foundAccessCode = true;
          console.log('✅ Found access code document:', accessCodeData);
        } else {
          // Search through all access codes
          console.log('🔍 Access code not found by ID, searching all...');
          const allAccessCodes = await getDocs(collection(db, 'accessCodes'));
          
          allAccessCodes.forEach((doc) => {
            const data = doc.data();
            if (data.code === trimmedCode) {
              accessCodeData = data;
              foundAccessCode = true;
              console.log('✅ Found access code in search:', data);
            }
          });
        }
      } catch (accessCodeError) {
        console.warn('⚠️ Error searching for access code:', accessCodeError);
        setDebugInfo('Warning: Could not verify access code, but continuing...');
      }
      
      if (!foundAccessCode) {
        console.log('⚠️ Access code not found, but user account was created');
        setDebugInfo('Access code not found, but account was created successfully.');
      } else {
        setDebugInfo('Access code found! Looking for child...');
        
        // Step 4: Find and Link Child (Simple approach)
        if (accessCodeData.childId) {
          try {
            console.log('👶 Attempting to link child:', accessCodeData.childId);
            
            const childDoc = await getDoc(doc(db, 'children', accessCodeData.childId));
            
            if (childDoc.exists()) {
              // Update child with parent info
              await setDoc(doc(db, 'children', accessCodeData.childId), {
                ...childDoc.data(),
                parentId: user.uid,
                parentRegistered: true,
                parentRegisteredAt: new Date().toISOString(),
                parentFirstName: formData.firstName,
                parentLastName: formData.lastName
              }, { merge: true });
              
              console.log('✅ Child linked successfully');
              setDebugInfo('Child linked successfully!');
            }
          } catch (childLinkError) {
            console.warn('⚠️ Could not link child:', childLinkError);
            setDebugInfo('Child linking failed, but account was created.');
          }
        }
        
        // Step 5: Mark access code as used
        try {
          await setDoc(doc(db, 'accessCodes', trimmedCode), {
            ...accessCodeData,
            used: true,
            usesLeft: 0,
            parentId: user.uid,
            usedAt: new Date().toISOString()
          }, { merge: true });
          
          console.log('✅ Access code marked as used');
        } catch (accessUpdateError) {
          console.warn('⚠️ Could not update access code:', accessUpdateError);
        }
      }
      
      // Success!
      setSuccessMessage(
        `🎉 Account created successfully!\n\n` +
        `Welcome ${formData.firstName} ${formData.lastName}!\n\n` +
        `You can now log in to your parent dashboard.\n\n` +
        `Redirecting in 3 seconds...`
      );
      
      setTimeout(() => {
        router.push('/auth/login?type=parent');
      }, 3000);
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(`Registration failed: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
      
      // If it's a permission error, provide specific guidance
      if (err.message.includes('insufficient permissions') || err.message.includes('Missing or insufficient permissions')) {
        setError(
          'Permission Error: There seems to be a Firestore security rules issue. ' +
          'Please check that the Firestore rules are set to allow authenticated users to read/write.'
        );
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (userType === 'admin') {
    return (
      <div className="auth-form-container">
        <div className="auth-tabs">
          <Link href={`/auth/signup?type=${userType}`} className="tab active">
            Sign up
          </Link>
          <Link href={`/auth/login?type=${userType}`} className="tab">
            Log in
          </Link>
        </div>
        
        <h2 className="auth-title">Admin Sign Up</h2>
        
        <div className="error-message">
          <p>Admin accounts can only be created by existing administrators.</p>
          <p>Please contact the daycare administrator for assistance.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auth-form-container">
      <div className="auth-tabs">
        <Link href={`/auth/signup?type=${userType}`} className="tab active">
          Sign up
        </Link>
        <Link href={`/auth/login?type=${userType}`} className="tab">
          Log in
        </Link>
      </div>
      
      <h2 className="auth-title">Parent Sign Up</h2>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          {debugInfo && (
            <details style={{ marginTop: '1rem' }}>
              <summary>Debug Info</summary>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>{debugInfo}</p>
            </details>
          )}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <pre>{successMessage}</pre>
        </div>
      )}
      
      {debugInfo && !error && !successMessage && (
        <div style={{ 
          background: '#e3f2fd', 
          padding: '0.75rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          Status: {debugInfo}
        </div>
      )}
      
      {!successMessage && (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="accessCode">Registration Access Code*</label>
            <input
              type="text"
              id="accessCode"
              name="accessCode"
              value={formData.accessCode}
              onChange={handleChange}
              required
              className="auth-input"
              disabled={loading}
              placeholder="Enter access code (e.g., XB7G97DM)"
              style={{ textTransform: 'uppercase' }}
            />
            <small>Enter the 8-character code provided by the daycare</small>
          </div>
          
          <div className="name-inputs">
            <div className="form-group half-width">
              <label htmlFor="firstName">First name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="auth-input"
                disabled={loading}
              />
            </div>
            
            <div className="form-group half-width">
              <label htmlFor="lastName">Last name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="auth-input"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
              disabled={loading}
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="auth-input"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Parent Account'}
          </button>
        </form>
      )}

      <div className="auth-redirect">
        <p>Already have an account?</p>
        <Link href={`/auth/login?type=parent`}>
          Log in instead
        </Link>
      </div>
    </div>
  );
};

export default SignupForm;