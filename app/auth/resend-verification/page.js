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
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <h2 className="auth-title">Resend Email Verification</h2>
          <p className="auth-subtitle">
            Enter your account credentials to resend the email verification link
          </p>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {message && (
            <div className="success-message">
              <pre>{message}</pre>
              <div style={{ marginTop: '16px' }}>
                <Link href="/auth/login?type=parent" className="auth-link">
                  ← Back to Login
                </Link>
              </div>
            </div>
          )}
          
          {!message && (
            <form onSubmit={handleResendVerification} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                  disabled={loading}
                  placeholder="Enter your email address"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                  disabled={loading}
                  placeholder="Enter your password"
                />
                <small>We need your password to verify your identity</small>
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="btn-loading">
                    <div className="spinner"></div>
                    <span>Sending verification email...</span>
                  </div>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </form>
          )}
          
          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link href="/auth/login?type=parent" className="auth-link">
                Back to Login
              </Link>
            </p>
            
            <p>
              Don't have an account yet?{' '}
              <Link href="/auth/signup?type=parent" className="auth-link">
                Sign up here
              </Link>
            </p>
            
            <div className="verification-help">
              <h4>📧 Email Verification Help</h4>
              <ul>
                <li>Check your spam/junk folder</li>
                <li>Make sure you're checking the correct email address</li>
                <li>Verification emails may take a few minutes to arrive</li>
                <li>Click the verification link from the same device/browser if possible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}