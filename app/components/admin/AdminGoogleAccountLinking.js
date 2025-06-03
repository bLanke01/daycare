// components/admin/AdminGoogleAccountLinking.js
'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, linkWithPopup, unlink } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../firebase/auth-context';
import { db } from '../../firebase/config';

const AdminGoogleAccountLinking = () => {
  const { user } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [googleData, setGoogleData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if Google account is already linked
  useEffect(() => {
    const checkGoogleLinkStatus = async () => {
      if (!user) return;
      
      try {
        setCheckingStatus(true);
        
        // Check from Firebase Auth providers
        const hasGoogleProvider = user.providerData.some(
          provider => provider.providerId === 'google.com'
        );
        
        // Check from Firestore user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let firestoreGoogleData = null;
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          firestoreGoogleData = userData.googleData;
          setIsLinked(userData.googleLinked === true || hasGoogleProvider);
        } else {
          setIsLinked(hasGoogleProvider);
        }
        
        setGoogleData(firestoreGoogleData);
        console.log('🔍 Admin Google link status:', { hasGoogleProvider, firestoreGoogleData });
        
      } catch (error) {
        console.error('Error checking Google link status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkGoogleLinkStatus();
  }, [user]);

  const linkGoogleAccount = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!user) {
        throw new Error('No user signed in');
      }

      console.log('🔗 Linking Google account for admin...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await linkWithPopup(user, provider);
      
      console.log('✅ Google account linked successfully for admin');
      
      // Update user document with Google data
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const currentData = userDoc.data();
        const signInMethods = currentData.signInMethods || ['password'];
        
        // Add google to sign-in methods if not already there
        if (!signInMethods.includes('google')) {
          signInMethods.push('google');
        }
        
        const googleAccountData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          linkedAt: new Date().toISOString(),
          linkedBy: 'admin' // Track that this was linked by an admin
        };
        
        await updateDoc(userDocRef, {
          signInMethods: signInMethods,
          googleLinked: true,
          googleData: googleAccountData,
          updatedAt: new Date().toISOString(),
          // Update profile picture if admin doesn't have one
          ...((!currentData.profilePicture && result.user.photoURL) && {
            profilePicture: result.user.photoURL
          })
        });
        
        setGoogleData(googleAccountData);
      }
      
      setIsLinked(true);
      setSuccess('🎉 Google account linked successfully! You can now sign in to the admin dashboard using either your email/password or Google.');
      
    } catch (error) {
      console.error('❌ Admin Google account linking error:', error);
      
      if (error.code === 'auth/credential-already-in-use') {
        setError('This Google account is already linked to another account. Please use a different Google account or contact the system administrator.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email address is already associated with another account.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked. Please allow pop-ups and try again.');
      } else {
        setError(`Failed to link Google account: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const unlinkGoogleAccount = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!user) {
        throw new Error('No user signed in');
      }

      console.log('🔗 Unlinking Google account for admin...');
      
      // Unlink from Firebase Auth
      await unlink(user, GoogleAuthProvider.PROVIDER_ID);
      
      // Update user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const currentData = userDoc.data();
        const signInMethods = (currentData.signInMethods || []).filter(method => method !== 'google');
        
        await updateDoc(userDocRef, {
          signInMethods: signInMethods,
          googleLinked: false,
          googleData: null,
          updatedAt: new Date().toISOString()
        });
      }
      
      setIsLinked(false);
      setGoogleData(null);
      setSuccess('Google account unlinked successfully. You can still sign in with your email and password.');
      
    } catch (error) {
      console.error('❌ Admin Google account unlinking error:', error);
      setError(`Failed to unlink Google account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmUnlink = () => {
    if (window.confirm(
      'Are you sure you want to unlink your Google account?\n\n' +
      'You will still be able to sign in with your email and password, ' +
      'but you won\'t be able to use Google sign-in until you link it again.\n\n' +
      'This will not affect your admin privileges.'
    )) {
      unlinkGoogleAccount();
    }
  };

  if (checkingStatus) {
    return (
      <div className="google-linking-container">
        <div className="loading">Checking Google account status...</div>
      </div>
    );
  }

  return (
    <div className="google-linking-container">
      <div className="section-header">
        <h3>🔗 Admin Google Account Linking</h3>
        <p>Link your Google account for faster, more secure access to the admin dashboard.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="google-account-status">
        {isLinked ? (
          <div className="linked-account">
            <div className="status-indicator linked">
              <div className="status-icon">✅</div>
              <div className="status-info">
                <h4>Google Account Linked</h4>
                <p>You can access the admin dashboard using either your email/password or Google account.</p>
              </div>
            </div>

            {googleData && (
              <div className="google-account-info">
                <div className="account-details">
                  {googleData.photoURL && (
                    <img 
                      src={googleData.photoURL} 
                      alt="Google Profile" 
                      className="google-avatar"
                    />
                  )}
                  <div className="account-text">
                    <p><strong>Google Account:</strong> {googleData.email}</p>
                    {googleData.displayName && (
                      <p><strong>Name:</strong> {googleData.displayName}</p>
                    )}
                    <p><strong>Linked:</strong> {new Date(googleData.linkedAt).toLocaleDateString()}</p>
                    <p><strong>Account Type:</strong> Administrator</p>
                  </div>
                </div>
              </div>
            )}

            <div className="account-actions">
              <button 
                onClick={confirmUnlink}
                disabled={loading}
                className="unlink-btn"
              >
                {loading ? 'Unlinking...' : 'Unlink Google Account'}
              </button>
            </div>
          </div>
        ) : (
          <div className="unlinked-account">
            <div className="status-indicator unlinked">
              <div className="status-icon">⚪</div>
              <div className="status-info">
                <h4>Google Account Not Linked</h4>
                <p>Link your Google account to enable quick and secure admin access.</p>
              </div>
            </div>

            <div className="benefits-list">
              <h5>Benefits for administrators:</h5>
              <ul>
                <li>✅ Faster access to admin dashboard - no passwords to remember</li>
                <li>✅ Enhanced security with Google's two-factor authentication</li>
                <li>✅ Seamless integration with Google Workspace (if used)</li>
                <li>✅ Professional profile picture synchronization</li>
                <li>✅ Backup sign-in method - use either email/password OR Google</li>
                <li>🔒 All admin privileges remain unchanged</li>
              </ul>
            </div>

            <div className="admin-note">
              <p><strong>Note:</strong> Linking your Google account does not change your admin permissions or access levels. This is purely for convenience and enhanced security.</p>
            </div>

            <div className="account-actions">
              <button 
                onClick={linkGoogleAccount}
                disabled={loading}
                className="link-btn"
              >
                {loading ? (
                  <div className="btn-loading">
                    <div className="spinner"></div>
                    <span>Linking Google Account...</span>
                  </div>
                ) : (
                  <div className="google-btn-content">
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Link Google Account</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="security-note">
        <h5>🔒 Security & Privacy for Administrators</h5>
        <ul>
          <li>We only access your basic Google profile (name, email, photo)</li>
          <li>No access to Gmail, Drive, Calendar, or other Google services</li>
          <li>Your admin permissions and access levels remain unchanged</li>
          <li>You can unlink your Google account at any time</li>
          <li>Email/password login will always remain available as backup</li>
          <li>Google linking is logged for security audit purposes</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminGoogleAccountLinking;