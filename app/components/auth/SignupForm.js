// components/auth/SignupForm.js (Updated for Parent Registration)
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
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
  const [successMessage, setSuccessMessage] = useState('');
  
  const { registerUser } = useAuth();
  
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
      
      console.log('🚀 Starting parent registration process...');
      console.log('Entered access code:', `"${formData.accessCode}"`);
      
      // Verify access code exists and is valid
      if (!formData.accessCode.trim()) {
        throw new Error('Access code is required for registration');
      }
      
      const trimmedCode = formData.accessCode.trim().toUpperCase();
      console.log('Looking for access code:', trimmedCode);
      
      // Search for the specific access code
      const accessCodesRef = collection(db, 'accessCodes');
      const accessCodeQuery = query(accessCodesRef, where('code', '==', trimmedCode));
      const accessCodesSnapshot = await getDocs(accessCodeQuery);
      
      if (accessCodesSnapshot.empty) {
        throw new Error(`Access code "${trimmedCode}" not found. Please check with the daycare for a valid access code.`);
      }
      
      // Get the first (and should be only) matching access code
      let foundCodeData = null;
      let foundDocRef = null;
      
      accessCodesSnapshot.forEach(docSnapshot => {
        foundCodeData = docSnapshot.data();
        foundDocRef = docSnapshot.ref;
      });
      
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
        throw new Error(`This access code was issued for ${foundCodeData.parentEmail}. Please use that email address or contact the daycare.`);
      }
      
      console.log('✅ All access code validations passed. Creating user account...');
      
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'parent',
        accessCode: trimmedCode,
        childId: foundCodeData.childId || null
      };
      
      const { user, error } = await registerUser(formData.email, formData.password, userData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ User created:', user.uid);
      
      // Update access code as used
      console.log('📝 Updating access code as used...');
      try {
        await updateDoc(foundDocRef, {
          used: true,
          usesLeft: 0,
          usedAt: new Date().toISOString(),
          parentId: user.uid
        });
      } catch (updateError) {
        console.warn('Warning: Could not update access code, but continuing...', updateError);
      }
      
      // Find and update children linked to this access code
      console.log('👶 Finding children with this access code...');
      const childrenQuery = query(
        collection(db, 'children'), 
        where('accessCode', '==', trimmedCode)
      );
      const childrenSnapshot = await getDocs(childrenQuery);
      
      console.log(`Found ${childrenSnapshot.size} children to link`);
      
      // Update each child to link with parent
      const updatePromises = [];
      const linkedChildren = [];
      
      childrenSnapshot.forEach(childDoc => {
        const childData = childDoc.data();
        console.log('Linking child:', childDoc.id, childData.firstName, childData.lastName);
        
        linkedChildren.push({
          id: childDoc.id,
          name: `${childData.firstName} ${childData.lastName}`
        });
        
        updatePromises.push(
          updateDoc(doc(db, 'children', childDoc.id), {
            parentId: user.uid,
            parentRegistered: true,
            parentRegisteredAt: new Date().toISOString()
          }).catch(error => {
            console.warn(`Warning: Could not update child ${childDoc.id}:`, error);
            return null; // Continue with other children
          })
        );
      });
      
      await Promise.allSettled(updatePromises);
      console.log('✅ Children linking process completed');
      
      // Show success message
      const childrenNames = linkedChildren.map(child => child.name).join(', ');
      setSuccessMessage(
        `🎉 Account created successfully!\n\n` +
        `Welcome ${formData.firstName} ${formData.lastName}!\n` +
        `Your account has been linked to: ${childrenNames}\n\n` +
        `You can now access your parent dashboard to view your child's daily activities, meals, attendance, and more.`
      );
      
      // Redirect after showing success message
      setTimeout(() => {
        console.log('🎉 Registration complete! Redirecting to parent dashboard...');
        router.push('/parent');
      }, 3000);
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.message);
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
      
      {error && <div className="error-message">{error}</div>}
      
      {successMessage && (
        <div className="success-message">
          <pre>{successMessage}</pre>
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
              placeholder="Enter the access code provided by the daycare"
              style={{ textTransform: 'uppercase' }}
            />
            <small>Enter the 8-character code provided when your child was registered</small>
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
            <small>This should match the email provided during child registration</small>
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