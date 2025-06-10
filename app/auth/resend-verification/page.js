// app/auth/resend-verification/page.js
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import Link from 'next/link';

export default function ResendVerification() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      console.log('🔐 Signing in to resend verification...');
      
      // Sign in the user temporarily to resend verification
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user.emailVerified) {
        setMessage('✅ Your email is already verified! You can now log in normally.');
        await signOut(auth);
        return;
      }
      
      console.log('📧 Sending verification email...');
      
      // Send verification email
      await sendEmailVerification(user, {
        url: `${window.location.origin}/auth/login?type=parent`,
        handleCodeInApp: false
      });
      
      // Sign out the user
      await signOut(auth);
      
      setMessage(
        '📧 Verification email sent successfully!\n\n' +
        'Please check your inbox (and spam folder) for the verification email.\n\n' +
        'Click the link in the email to verify your account, then try logging in again.'
      );
      
      console.log('✅ Verification email sent successfully');
      
    } catch (error) {
      console.error('❌ Error resending verification:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address. Please check your email or sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please enter the correct password for your account.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes before trying again.');
      } else {
        setError(`Failed to resend verification email: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-2">Resend Email Verification</h2>
          <p className="text-center text-base-content/70 mb-6">
            Enter your account credentials to resend the email verification link
          </p>
          
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {message && (
            <div className="alert alert-success mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex flex-col gap-4">
                <pre className="whitespace-pre-wrap">{message}</pre>
                <Link href="/auth/login?type=parent" className="link link-primary">
                  ← Back to Login
                </Link>
              </div>
            </div>
          )}
          
          {!message && (
            <form onSubmit={handleResendVerification} className="form-control gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input input-bordered w-full"
                  disabled={loading}
                  placeholder="Enter your email address"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input input-bordered w-full"
                  disabled={loading}
                  placeholder="Enter your password"
                />
                <label className="label">
                  <span className="label-text-alt">We need your password to verify your identity</span>
                </label>
              </div>
              
              <button 
                type="submit" 
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Sending verification email...' : 'Resend Verification Email'}
              </button>
            </form>
          )}
          
          <div className="divider"></div>
          
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p>
                Remember your password?{' '}
                <Link href="/auth/login?type=parent" className="link link-primary">
                  Back to Login
                </Link>
              </p>
              
              <p>
                Don't have an account yet?{' '}
                <Link href="/auth/signup?type=parent" className="link link-primary">
                  Sign up here
                </Link>
              </p>
            </div>
            
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="font-semibold mb-2">📧 Email Verification Help</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Check your spam/junk folder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Make sure you're checking the correct email address</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verification emails may take a few minutes to arrive</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Click the verification link from the same device/browser if possible</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}