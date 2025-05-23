// components/auth/LoginForm.js
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../firebase/auth-context';
import { getDoc, doc } from 'firebase/firestore'; // Add this import
import { db } from '../../firebase/config'; // Add this import

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'parent'; // Default to parent if not specified
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signInWithGoogle } = useAuth();
  
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
      setLoading(true);
      
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Google login is only for parents
      router.push('/parent');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-form-container">
      <div className="auth-tabs">
        <Link href={`/auth/signup?type=${userType}`} className="tab">
          Sign up
        </Link>
        <Link href={`/auth/login?type=${userType}`} className="tab active">
          Log in
        </Link>
      </div>
      
      <h2 className="auth-title">Login</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="google-auth-btn" 
        onClick={handleGoogleLogin}
        disabled={loading || userType === 'admin'}
      >
        <img src="/google-icon.svg" alt="Google" className="google-icon" />
        Login with Google
      </button>
      
      {userType === 'admin' && (
        <div className="info-message">
          Google login is only available for parent accounts
        </div>
      )}
      
      <div className="divider">
        <span>OR</span>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
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
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;