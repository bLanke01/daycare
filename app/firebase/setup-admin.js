// app/firebase/setup-admin.js
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export default function SetupAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'admin-secret-123'; // Use environment variable in production

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (secretKey !== ADMIN_SECRET_KEY) {
      setMessage('Invalid secret key');
      return;
    }

    try {
      setLoading(true);
      
      // Check if admin account already exists
      const adminSnapshot = await getDoc(doc(db, 'system', 'admin_setup'));
      if (adminSnapshot.exists() && adminSnapshot.data().initialized) {
        setMessage('Admin account already exists. Please contact system administrator.');
        setLoading(false);
        return;
      }

      // Create admin user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set user role to admin
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
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

      setMessage('Admin account created successfully! You can now log in.');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-title">Initial Admin Setup</h2>
      {message && <div className={message.includes('Error') ? 'error-message' : 'info-message'}>{message}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Admin Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
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
            minLength="8"
            className="auth-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="secretKey">Admin Secret Key</label>
          <input
            type="password"
            id="secretKey"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            required
            className="auth-input"
          />
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
  );
}