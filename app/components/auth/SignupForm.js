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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="tabs tabs-boxed justify-center mb-6">
            <Link href={`/auth/signup?type=${userType}`} className="tab tab-active">
              Sign up
            </Link>
            <Link href={`/auth/login?type=${userType}`} className="tab">
              Log in
            </Link>
          </div>
          
          <h2 className="card-title justify-center mb-6">Admin Sign Up</h2>
          
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold">Admin Registration Restricted</h3>
              <p>Admin accounts can only be created by existing administrators.</p>
              <p>Please contact the daycare administrator for assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="tabs tabs-boxed justify-center mb-6">
            <Link href={`/auth/signup?type=${userType}`} className="tab tab-active">
              Sign up
            </Link>
            <Link href={`/auth/login?type=${userType}`} className="tab">
              Log in
            </Link>
          </div>
          
          <h2 className="card-title justify-center mb-2">Parent Sign Up</h2>
          <p className="text-center text-base-content/70 mb-6">Create your account to access your child's daycare information</p>
          
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p>{error}</p>
                {debugInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Debug Info</summary>
                    <p className="mt-2 text-sm opacity-70">{debugInfo}</p>
                  </details>
                )}
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <pre className="whitespace-pre-wrap text-sm">{successMessage}</pre>
            </div>
          )}
          
          {debugInfo && !error && !successMessage && (
            <div className="alert alert-info mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Status: {debugInfo}</span>
            </div>
          )}
          
          {!successMessage && (
            <form onSubmit={handleSubmit} className="form-control gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Registration Access Code*</span>
                </label>
                <input
                  type="text"
                  name="accessCode"
                  value={formData.accessCode}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full uppercase"
                  disabled={loading}
                  placeholder="Enter access code (e.g., XB7G97DM)"
                />
                <label className="label">
                  <span className="label-text-alt">Enter the 8-character code provided by the daycare</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">First name</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input input-bordered w-full"
                    disabled={loading}
                    placeholder="Your first name"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Last name</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input input-bordered w-full"
                    disabled={loading}
                    placeholder="Your last name"
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  disabled={loading}
                  placeholder="Enter your email address"
                />
                <label className="label">
                  <span className="label-text-alt text-warning">⚠️ You'll need to verify this email before you can log in</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  disabled={loading}
                  minLength="6"
                  placeholder="Create a secure password"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  disabled={loading}
                  placeholder="Confirm your password"
                />
              </div>
              
              <button 
                type="submit" 
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Creating Your Account...' : 'Create Parent Account'}
              </button>
            </form>
          )}

          <div className="divider"></div>

          <div className="space-y-6 text-center">
            <div>
              <p className="text-base-content/70">Already have an account?</p>
              <Link href={`/auth/login?type=parent`} className="link link-primary">
                Log in instead
              </Link>
            </div>
            
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="font-semibold mb-2">After creating your account, you can:</h3>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span>View your child's daily activities</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span>Check schedules and events</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span>Message daycare staff</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">🔗</span>
                    <span>Link your Google account for easy login (optional)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;