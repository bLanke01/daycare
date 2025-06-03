// components/auth/SignupForm.js - Enhanced with email notifications
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
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
  
  const sendWelcomeNotification = async (user, childData, accessCodeData) => {
    try {
      // Send Firebase email verification (acts as welcome email)
      await sendEmailVerification(user, {
        url: `${window.location.origin}/parent`, // Redirect after email verification
        handleCodeInApp: false
      });
      
      console.log('✅ Welcome email sent to:', user.email);
      
      // Optional: Store email notification in Firestore for tracking
      await setDoc(doc(db, 'notifications', `${user.uid}_welcome`), {
        type: 'welcome_email',
        userId: user.uid,
        email: user.email,
        sentAt: new Date().toISOString(),
        childName: childData ? `${childData.firstName} ${childData.lastName}` : 'Unknown',
        accessCode: accessCodeData?.code || 'Unknown'
      });
      
      return true;
    } catch (error) {
      console.error('⚠️ Could not send welcome email:', error);
      return false;
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
      setDebugInfo('Starting registration...');
      
      const trimmedCode = formData.accessCode.trim().toUpperCase();
      console.log('🚀 Starting registration with code:', trimmedCode);
      
      // Step 1: Create Firebase Auth User
      setDebugInfo('Creating your account...');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      console.log('✅ Auth user created:', user.uid);
      setDebugInfo('Account created! Setting up your profile...');
      
      // Step 2: Create User Profile in Firestore
      const userDocData = {
        uid: user.uid,
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'parent',
        accessCode: trimmedCode,
        signInMethods: ['password'], // Track available sign-in methods
        googleLinked: false, // Not linked yet - can be done later
        emailVerified: false, // Will be true after they verify email
        createdAt: new Date().toISOString(),
        registrationCompleted: true,
        accountSettings: {
          emailNotifications: true,
          smsNotifications: false,
          dailyUpdates: true,
          weeklyReports: true
        }
      };
      
      await setDoc(doc(db, 'users', user.uid), userDocData);
      console.log('✅ User profile saved');
      setDebugInfo('Profile created! Looking for your child...');
      
      // Step 3: Find and Link Child (if access code valid)
      let childData = null;
      let accessCodeData = null;
      
      try {
        // Search for access code
        const allAccessCodes = await getDocs(collection(db, 'accessCodes'));
        let foundAccessCode = false;
        
        allAccessCodes.forEach((doc) => {
          const data = doc.data();
          if (data.code === trimmedCode && !data.used) {
            accessCodeData = { id: doc.id, ...data };
            foundAccessCode = true;
          }
        });
        
        if (foundAccessCode && accessCodeData.childId) {
          // Link child to parent
          const childDoc = await getDoc(doc(db, 'children', accessCodeData.childId));
          
          if (childDoc.exists()) {
            childData = childDoc.data();
            
            // Update child with parent info
            await setDoc(doc(db, 'children', accessCodeData.childId), {
              ...childData,
              parentId: user.uid,
              parentRegistered: true,
              parentRegisteredAt: new Date().toISOString(),
              parentFirstName: formData.firstName,
              parentLastName: formData.lastName,
              parentEmail: formData.email
            }, { merge: true });
            
            // Update access code as used
            await setDoc(doc(db, 'accessCodes', accessCodeData.id), {
              ...accessCodeData,
              used: true,
              usesLeft: 0,
              parentId: user.uid,
              usedAt: new Date().toISOString()
            }, { merge: true });
            
            console.log('✅ Child linked successfully');
            setDebugInfo('Child linked! Sending welcome email...');
          }
        }
      } catch (linkError) {
        console.warn('⚠️ Could not process access code:', linkError);
        setDebugInfo('Access code verification had issues, but account was created.');
      }
      
      // Step 4: Send Welcome Email
      setDebugInfo('Sending welcome email...');
      const emailSent = await sendWelcomeNotification(user, childData, accessCodeData);
      
      // Step 5: Success!
      const childName = childData ? `${childData.firstName} ${childData.lastName}` : 'your child';
      const emailStatus = emailSent ? 
        '\n📧 IMPORTANT: A verification email has been sent to your inbox!' : 
        '\n⚠️ Verification email could not be sent, but your account was created.';
        
      setSuccessMessage(
        `🎉 Account created successfully!\n\n` +
        `Welcome ${formData.firstName} ${formData.lastName}!\n\n` +
        `✅ Your account has been created\n` +
        `👶 Child: ${childName}\n` +
        `📧 Email: ${formData.email}\n` +
        `🔑 Access code: ${trimmedCode}${emailStatus}\n\n` +
        `🚨 NEXT STEP: VERIFY YOUR EMAIL\n` +
        `📬 Check your inbox (and spam folder) for a verification email\n` +
        `🔗 Click the verification link in the email\n` +
        `🚫 You CANNOT log in until your email is verified\n\n` +
        `After verification, you can:\n` +
        `• Log in to your parent dashboard\n` +
        `• View your child's activities\n` +
        `• Link your Google account (optional)\n\n` +
        `Redirecting to login in 8 seconds...`
      );
      
      setTimeout(() => {
        router.push('/auth/login?type=parent');
      }, 8000);
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(`Registration failed: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
      
      // Provide specific error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters with numbers and letters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
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
      <p className="auth-subtitle">Create your account to access your child's daycare information</p>
      
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
        <div className="status-message">
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
                placeholder="Your first name"
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
                placeholder="Your last name"
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
              placeholder="Enter your email address"
            />
            <small>⚠️ You'll need to verify this email before you can log in</small>
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
              placeholder="Create a secure password"
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
              placeholder="Confirm your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="btn-loading">
                <div className="spinner"></div>
                <span>Creating Your Account...</span>
              </div>
            ) : (
              'Create Parent Account'
            )}
          </button>
        </form>
      )}

      <div className="auth-footer">
        <p>Already have an account?</p>
        <Link href={`/auth/login?type=parent`} className="auth-link">
          Log in instead
        </Link>
        
        <div className="signup-benefits">
          <h4>After creating your account, you can:</h4>
          <ul>
            <li>📱 View your child's daily activities</li>
            <li>📅 Check schedules and events</li>
            <li>💬 Message daycare staff</li>
            <li>🔗 Link your Google account for easy login (optional)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;