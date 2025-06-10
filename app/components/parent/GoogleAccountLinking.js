// components/parent/GoogleAccountLinking.js
'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, linkWithPopup, unlink } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../firebase/auth-context';
import { db } from '../../firebase/config';

const GoogleAccountLinking = () => {
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
        console.log('🔍 Google link status:', { hasGoogleProvider, firestoreGoogleData });
        
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

      console.log('🔗 Linking Google account...');
      
      const provider = new GoogleAuthProvider();
      // Add scopes for profile information
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await linkWithPopup(user, provider);
      
      console.log('✅ Google account linked successfully');
      
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
          linkedAt: new Date().toISOString()
        };
        
        await updateDoc(userDocRef, {
          signInMethods: signInMethods,
          googleLinked: true,
          googleData: googleAccountData,
          updatedAt: new Date().toISOString(),
          // Update profile picture if user doesn't have one
          ...((!currentData.profilePicture && result.user.photoURL) && {
            profilePicture: result.user.photoURL
          })
        });
        
        setGoogleData(googleAccountData);
      }
      
      setIsLinked(true);
      setSuccess('🎉 Google account linked successfully! You can now sign in with either your email/password or Google.');
      
    } catch (error) {
      console.error('❌ Google account linking error:', error);
      
      if (error.code === 'auth/credential-already-in-use') {
        setError('This Google account is already linked to another daycare account. Please use a different Google account.');
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

      console.log('🔗 Unlinking Google account...');
      
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
      console.error('❌ Google account unlinking error:', error);
      setError(`Failed to unlink Google account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmUnlink = () => {
    if (window.confirm(
      'Are you sure you want to unlink your Google account?\n\n' +
      'You will still be able to sign in with your email and password, ' +
      'but you won\'t be able to use Google sign-in until you link it again.'
    )) {
      unlinkGoogleAccount();
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-bold">🔗 Google Account Linking</h3>
        <p className="text-base-content/70">Link your Google account for faster, easier sign-in to your daycare dashboard.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <div className="card bg-base-200">
        <div className="card-body">
          {isLinked ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-base-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-error" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
              </div>
                <div>
                  <h4 className="font-bold">Google Account Linked</h4>
                  <p className="text-sm text-base-content/70">You can sign in using either your email/password or Google account.</p>
                </div>
              </div>

              {googleData && (
                <div className="card bg-base-100">
                  <div className="card-body">
                    <div className="flex items-center gap-4">
                      {googleData.photoURL && (
                        <div className="avatar">
                          <div className="w-12 rounded-full">
                            <img src={googleData.photoURL} alt="Google Profile" />
                          </div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p><span className="font-bold">Google Account:</span> {googleData.email}</p>
                        {googleData.displayName && (
                          <p><span className="font-bold">Name:</span> {googleData.displayName}</p>
                        )}
                        <p><span className="font-bold">Linked:</span> {new Date(googleData.linkedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card-actions">
                <button 
                  onClick={confirmUnlink}
                  disabled={loading}
                  className="btn btn-error"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Unlinking...
                    </>
                  ) : (
                    'Unlink Google Account'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="badge badge-outline gap-2">Not Linked</div>
                <div>
                  <h4 className="font-bold">Google Account Not Linked</h4>
                  <p className="text-sm text-base-content/70">Link your Google account to enable one-click sign-in.</p>
                </div>
              </div>

              <div className="card bg-base-100">
                <div className="card-body">
                  <h5 className="card-title text-lg">Benefits of linking your Google account:</h5>
                  <ul className="list-none space-y-2">
                    <li className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Faster sign-in - no need to remember passwords</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>More secure - Google handles authentication</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Auto-sync profile picture from Google</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Choice - use either email/password OR Google to sign in</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  onClick={linkGoogleAccount}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Linking Google Account...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Link Google Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h5 className="font-bold">🔒 Security & Privacy</h5>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>We only access your basic Google profile (name, email, photo)</li>
            <li>We never access your Gmail, Drive, or other Google services</li>
            <li>You can unlink your Google account at any time</li>
            <li>Your account will still work with email/password if you unlink Google</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GoogleAccountLinking;