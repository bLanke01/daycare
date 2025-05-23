// components/auth/SignupForm.js (Enhanced with debugging)
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../firebase/auth-context';
import { db } from '../../firebase/config';

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
  const [debugInfo, setDebugInfo] = useState('');
  
  const { registerUser, signInWithGoogle } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Debug function to check all access codes
  const debugAccessCodes = async () => {
    try {
      console.log('🔍 Debugging access codes...');
      setDebugInfo('Checking access codes...');
      
      const accessCodesRef = collection(db, 'accessCodes');
      const snapshot = await getDocs(accessCodesRef);
      
      console.log('Total access codes found:', snapshot.size);
      
      let debugText = `Found ${snapshot.size} access codes:\n`;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('Access Code Details:', {
          documentId: doc.id,
          code: data.code,
          used: data.used,
          usesLeft: data.usesLeft,
          parentEmail: data.parentEmail,
          childName: data.childName,
          expiresAt: data.expiresAt
        });
        
        debugText += `\nCode: "${data.code}" | Used: ${data.used} | UsesLeft: ${data.usesLeft} | Email: ${data.parentEmail}\n`;
      });
      
      setDebugInfo(debugText);
      
    } catch (error) {
      console.error('Error debugging access codes:', error);
      setDebugInfo(`Error: ${error.message}`);
    }
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
      
      console.log('🚀 Starting registration process...');
      console.log('Entered access code:', `"${formData.accessCode}"`);
      console.log('Trimmed access code:', `"${formData.accessCode.trim()}"`);
      
      // Verify access code exists and is valid
      if (!formData.accessCode.trim()) {
        throw new Error('Access code is required for registration');
      }
      
      const trimmedCode = formData.accessCode.trim();
      console.log('Looking for access code:', trimmedCode);
      
      // Search through all access codes to find a match
      const accessCodesRef = collection(db, 'accessCodes');
      const accessCodesSnapshot = await getDocs(accessCodesRef);
      
      let foundCodeData = null;
      let foundDocRef = null;
      
      console.log(`📝 Checking ${accessCodesSnapshot.size} access codes...`);
      
      accessCodesSnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        console.log(`Comparing "${trimmedCode}" with "${data.code}"`);
        
        if (data.code === trimmedCode) {
          foundCodeData = data;
          foundDocRef = docSnapshot.ref;
          console.log('✅ Found matching access code!');
        }
      });
      
      if (!foundCodeData) {
        // Show all available codes for debugging
        const availableCodes = [];
        accessCodesSnapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          availableCodes.push(`"${data.code}" (used: ${data.used})`);
        });
        
        console.log('❌ No matching code found. Available codes:', availableCodes);
        throw new Error(`Access code "${trimmedCode}" not found. Available codes in console.`);
      }
      
      console.log('📋 Access code data:', foundCodeData);
      
      // Check if code is expired
      const expiryDate = new Date(foundCodeData.expiresAt);
      const now = new Date();
      console.log('Expiry check:', { expiryDate, now, expired: expiryDate < now });
      
      if (expiryDate < now) {
        throw new Error('This access code has expired. Please contact the daycare for a new code.');
      }
      
      // Check if code is already used
      console.log('Usage check:', { used: foundCodeData.used, usesLeft: foundCodeData.usesLeft });
      
      if (foundCodeData.used || foundCodeData.usesLeft <= 0) {
        throw new Error('This access code has already been used.');
      }
      
      // Verify email matches (if specified in access code)
      if (foundCodeData.parentEmail && 
          foundCodeData.parentEmail.toLowerCase() !== formData.email.toLowerCase()) {
        console.log('Email mismatch:', { 
          expected: foundCodeData.parentEmail.toLowerCase(), 
          entered: formData.email.toLowerCase() 
        });
        throw new Error(`This access code was issued for ${foundCodeData.parentEmail}. Please use that email address.`);
      }
      
      console.log('✅ All validations passed. Creating user account...');
      
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'parent'
      };
      
      const { user, error } = await registerUser(formData.email, formData.password, userData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ User created:', user.uid);
      
      // Update access code as used
      console.log('📝 Updating access code as used...');
      await updateDoc(foundDocRef, {
        used: true,
        usesLeft: 0,
        usedAt: new Date().toISOString(),
        parentId: user.uid
      });
      
      // Find and update children linked to this access code
      console.log('👶 Finding children with this access code...');
      const childrenQuery = query(
        collection(db, 'children'), 
        where('accessCode', '==', foundCodeData.code)
      );
      const childrenSnapshot = await getDocs(childrenQuery);
      
      console.log(`Found ${childrenSnapshot.size} children to link`);
      
      // Update each child to link with parent
      const updatePromises = [];
      childrenSnapshot.forEach(childDoc => {
        console.log('Linking child:', childDoc.id);
        updatePromises.push(
          updateDoc(doc(db, 'children', childDoc.id), {
            parentId: user.uid,
            parentRegistered: true,
            parentRegisteredAt: new Date().toISOString()
          })
        );
      });
      
      await Promise.all(updatePromises);
      console.log('✅ All children linked successfully');
      
      // Success! Redirect to parent dashboard
      console.log('🎉 Registration complete! Redirecting to dashboard...');
      router.push('/parent');
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    // Similar implementation but for Google signup
    setError('Google signup temporarily disabled. Please use email signup.');
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
        
        <div className="auth-redirect">
          <p>Already have an admin account?</p>
          <Link href={`/auth/login?type=admin`}>
            <button className="auth-button login-btn">
              Go to Admin Login
            </button>
          </Link>
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
      
      {/* Debug Section */}
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '1rem', 
        marginBottom: '1rem', 
        borderRadius: '4px' 
      }}>
        <button 
          type="button" 
          onClick={debugAccessCodes}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '0.5rem'
          }}
        >
          🔍 Debug Access Codes
        </button>
        {debugInfo && (
          <pre style={{ 
            fontSize: '0.8rem', 
            backgroundColor: 'white', 
            padding: '0.5rem', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {debugInfo}
          </pre>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
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
            placeholder="Enter access code (e.g., QCY3Y1T or N58N7ZGR)"
          />
          <small>Try: QCY3Y1T or N58N7ZGR</small>
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
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

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