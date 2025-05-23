// app/admin-setup/page.js (additional fixes)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';

export default function AdminSetupPage() {
  const [isInitialized, setIsInitialized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    secretKey: ''
  });
  const router = useRouter();

  // Environment variable or default
  const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'admin-secret-123';

  useEffect(() => {
    const checkAdminSetup = async () => {
      try {
        const adminSnapshot = await getDoc(doc(db, 'system', 'admin_setup'));
        if (adminSnapshot.exists() && adminSnapshot.data().initialized) {
          setIsInitialized(true);
          setLoading(false);
          // Wait a moment before redirecting
          setTimeout(() => {
            router.push('/auth/login?type=admin');
          }, 1000);
        } else {
          setIsInitialized(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking admin setup:', error);
        setIsInitialized(false);
        setLoading(false);
      }
    };

    checkAdminSetup();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.secretKey !== ADMIN_SECRET_KEY) {
      setError('Invalid secret key');
      return;
    }

    try {
      setLoading(true);
      
      // Check once more if admin setup is already done
      const adminSnapshot = await getDoc(doc(db, 'system', 'admin_setup'));
      if (adminSnapshot.exists() && adminSnapshot.data().initialized) {
        setError('Admin account already exists.');
        setLoading(false);
        return;
      }
      
      // Create admin user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Set user role to admin
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'admin',
        isOwner: true,
        createdAt: new Date().toISOString()
      });

      // Mark admin setup as complete
      await setDoc(doc(db, 'system', 'admin_setup'), {
        initialized: true,
        initialAdminId: user.uid,
        createdAt: new Date().toISOString()
      });

      setError('');
      setIsInitialized(true);
      
      // Show success message before redirecting
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
      
    } catch (error) {
      console.error('Admin setup error:', error);
      setError(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  // If still checking initialization status
  if (loading && isInitialized === null) {
    return (
      <div className="admin-setup-page">
        <div className="container">
          <div className="loading-spinner">Checking system setup...</div>
        </div>
      </div>
    );
  }

  // If setup is already initialized and we're redirecting
  if (isInitialized === true) {
    return (
      <div className="admin-setup-page">
        <div className="container">
          <div className="info-message">
            Admin account already exists. Redirecting to login page...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-setup-page">
      <div className="container">
        <div className="auth-form-container">
          <h2 className="auth-title">Initial Admin Setup</h2>
          <p>Create the first administrator account for your daycare system.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Admin Email</label>
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
                minLength="8"
                className="auth-input"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
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
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
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
            
            <div className="form-group">
              <label htmlFor="secretKey">Admin Secret Key</label>
              <input
                type="password"
                id="secretKey"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                required
                className="auth-input"
                disabled={loading}
              />
              <small>Enter the secret key provided by your system administrator</small>
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Setup Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}