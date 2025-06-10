// components/admin/AdminGoogleAccountLinking.js
'use client';

import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  linkWithPopup, 
  unlink, 
  getAuth, 
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
import { auth } from '../../firebase/config';

const AdminGoogleAccountLinking = () => {
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);

  useEffect(() => {
    checkGoogleLinkStatus();
  }, []);

  const checkGoogleLinkStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No user is currently signed in');
        setLoading(false);
        return;
      }

      const providers = await fetchSignInMethodsForEmail(auth, user.email);
      setIsLinked(providers.includes('google.com'));
    } catch (error) {
      console.error('Error checking Google link status:', error);
      setError('Failed to check Google account status');
    } finally {
      setLoading(false);
    }
  };

  const linkGoogleAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const provider = new GoogleAuthProvider();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No user is currently signed in');
      }

      await linkWithPopup(user, provider);
      setIsLinked(true);
      setSuccess('Successfully linked Google account');
    } catch (error) {
      console.error('Error linking Google account:', error);
      setError(
        error.code === 'auth/credential-already-in-use'
          ? 'This Google account is already linked to another user'
          : 'Failed to link Google account'
      );
    } finally {
      setLoading(false);
    }
  };

  const unlinkGoogleAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      await unlink(user, 'google.com');
      setIsLinked(false);
      setSuccess('Successfully unlinked Google account');
      setShowConfirmUnlink(false);
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      setError('Failed to unlink Google account');
    } finally {
      setLoading(false);
    }
  };

  const confirmUnlink = () => {
    setShowConfirmUnlink(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Google Account</h3>

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

      <div className="flex items-center justify-between bg-base-200 p-4 rounded-lg">
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
            <h4 className="font-medium">Google Account</h4>
            <p className="text-sm text-base-content/70">
              {isLinked ? 'Your account is linked with Google' : 'Link your account with Google'}
            </p>
          </div>
        </div>

        {isLinked ? (
          showConfirmUnlink ? (
            <div className="join">
              <button 
                className="btn btn-error btn-sm join-item"
                onClick={unlinkGoogleAccount}
                disabled={loading}
              >
                Confirm Unlink
              </button>
              <button 
                className="btn btn-ghost btn-sm join-item"
                onClick={() => setShowConfirmUnlink(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-outline btn-error btn-sm"
              onClick={confirmUnlink}
              disabled={loading}
            >
              Unlink Account
            </button>
          )
        ) : (
          <button 
            className="btn btn-primary btn-sm"
            onClick={linkGoogleAccount}
            disabled={loading}
          >
            Link Account
          </button>
        )}
      </div>

      <div className="text-sm text-base-content/70">
        {isLinked ? (
          <p>
            ℹ️ Unlinking your Google account will remove the ability to sign in with Google.
            You will still be able to sign in with your email and password.
          </p>
        ) : (
          <p>
            ℹ️ Linking your Google account allows you to sign in quickly and securely using your Google credentials.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminGoogleAccountLinking;