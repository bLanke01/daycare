// components/auth/LoginForm.js - Fixed to prevent new account creation
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../firebase/auth-context';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase/config';

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'parent';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { signIn } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      const { user, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        throw new Error(error.message);
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new Error('Please verify your email address before logging in. Check your inbox for the verification email.');
      }
      
      // Verify user role matches the type they're trying to log in as
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== userType) {
        throw new Error(`You are not registered as a ${userType === 'admin' ? 'Staff/Admin' : 'Parent'}`);
      }
      
      // Redirect based on role
      if (userType === 'admin') {
        router.push('/admin');
      } else {
        router.push('/parent');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      
      console.log('🔐 Attempting Google sign-in for existing users only...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('✅ Google sign-in successful, checking if user exists...');
      
      // Check if this user already exists in our system
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // This is a new user trying to sign in with Google - not allowed
        console.log('❌ New user attempted Google login');
        
        // Sign them out immediately
        await auth.signOut();
        
        throw new Error(
          'No account found with this Google account. ' +
          'Please sign up first using your access code, then you can link your Google account in settings.'
        );
      }
      
      // User exists - check their role and email verification
      const userData = userDoc.data();
      
      // Check if email is verified (for users who signed up with email/password first)
      if (userData.signInMethods?.includes('password') && !user.emailVerified) {
        await auth.signOut();
        throw new Error(
          'Please verify your email address first. Check your inbox for the verification email, ' +
          'then try logging in with your email and password.'
        );
      }
      
      // Check role matches what they're trying to access
      if (userData.role !== userType) {
        await auth.signOut();
        throw new Error(
          `This Google account is registered as a ${userData.role === 'admin' ? 'Staff/Admin' : 'Parent'}. ` +
          `Please use the correct login page.`
        );
      }
      
      console.log('✅ Existing user verified, logging in...');
      
      // Update last login
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        lastLogin: new Date().toISOString()
      });
      
      // Redirect to appropriate dashboard
      if (userType === 'admin') {
        router.push('/admin');
      } else {
        router.push('/parent');
      }
      
    } catch (err) {
      console.error('❌ Google login error:', err);
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="tabs tabs-boxed justify-center mb-6">
            <Link href={`/auth/signup?type=${userType}`} className="tab">
              Sign up
            </Link>
            <Link href={`/auth/login?type=${userType}`} className="tab tab-active">
              Log in
            </Link>
          </div>
          
          <h2 className="card-title justify-center mb-6">
            {userType === 'admin' ? 'Staff/Admin Login' : 'Parent Login'}
          </h2>
          
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <button 
            className={`btn btn-outline gap-2 mb-6 ${googleLoading ? 'loading' : ''}`}
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            type="button"
          >
            {googleLoading ? (
              <span>Checking account...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
          
          <div className="text-sm text-center mb-6">
            <p>🔒 Google sign-in is only for existing accounts. 
            {userType === 'admin' ? (
              <span> Admins can link Google accounts in Settings after logging in.</span>
            ) : (
              <span> New to our daycare? <Link href={`/auth/signup?type=${userType}`} className="link link-primary">Sign up first</Link></span>
            )}
            </p>
          </div>
          
          <div className="divider">OR</div>
          
          <form onSubmit={handleSubmit} className="form-control gap-4">
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
                disabled={loading || googleLoading}
                placeholder="Enter your email"
              />
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
                disabled={loading || googleLoading}
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading || googleLoading}
            >
              {loading ? 'Signing in...' : `Sign in as ${userType === 'admin' ? 'Staff/Admin' : 'Parent'}`}
            </button>
          </form>

          <div className="divider"></div>

          <div className="space-y-4 text-center text-sm">
            <p>
              Don't have an account?{' '}
              <Link href={`/auth/signup?type=${userType}`} className="link link-primary">
                Sign up here
              </Link>
            </p>
            
            <p>
              Need to verify your email?{' '}
              <Link href="/auth/resend-verification" className="link link-primary">
                Resend verification email
              </Link>
            </p>
            
            {userType === 'parent' && (
              <p>
                Are you a staff member?{' '}
                <Link href="/auth/login?type=admin" className="link link-primary">
                  Staff/Admin Login
                </Link>
              </p>
            )}
            
            {userType === 'admin' && (
              <p>
                Are you a parent?{' '}
                <Link href="/auth/login?type=parent" className="link link-primary">
                  Parent Login
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;