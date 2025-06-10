// components/NotificationSettings.js - Updated with new notification types
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/auth-context';

const NotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    email: {
      enabled: true,
      events: true,
      announcements: true,
      payments: true,
      dailyReports: true
    },
    push: {
      enabled: true,
      events: true,
      announcements: true,
      payments: true,
      dailyReports: false
    },
    sms: {
      enabled: false,
      events: false,
      announcements: false,
      payments: true,
      dailyReports: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user?.uid]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const settingsRef = doc(db, 'userSettings', user.uid);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setSettings(data.notifications || settings);
      } else {
        // Create default settings document
        await setDoc(settingsRef, {
          notifications: settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.error('Error loading notification settings:', err);
      setError(`Failed to load notification settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (channel, setting) => {
    setSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [setting]: !prev[channel][setting]
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const settingsRef = doc(db, 'userSettings', user.uid);
      await setDoc(settingsRef, {
        notifications: settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError(`Failed to save notification settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content">
          <span className="text-primary">Notification</span> Settings
        </h1>

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
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Email Notifications</h2>
            
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Enable Email Notifications</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.email.enabled}
                  onChange={() => handleToggle('email', 'enabled')}
                />
              </label>
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Calendar Events</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.email.events}
                    onChange={() => handleToggle('email', 'events')}
                    disabled={!settings.email.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Get notified about new events, changes, and reminders
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Announcements</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.email.announcements}
                    onChange={() => handleToggle('email', 'announcements')}
                    disabled={!settings.email.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Important announcements and updates from the daycare
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Payment Notifications</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.email.payments}
                    onChange={() => handleToggle('email', 'payments')}
                    disabled={!settings.email.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Invoices, payment confirmations, and payment reminders
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Daily Reports</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.email.dailyReports}
                    onChange={() => handleToggle('email', 'dailyReports')}
                    disabled={!settings.email.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Daily activity reports and updates about your child
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Push Notifications</h2>
            
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Enable Push Notifications</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.push.enabled}
                  onChange={() => handleToggle('push', 'enabled')}
                />
              </label>
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Calendar Events</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.push.events}
                    onChange={() => handleToggle('push', 'events')}
                    disabled={!settings.push.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Get instant notifications about events and schedule changes
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Announcements</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.push.announcements}
                    onChange={() => handleToggle('push', 'announcements')}
                    disabled={!settings.push.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Stay updated with important announcements in real-time
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Payment Notifications</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.push.payments}
                    onChange={() => handleToggle('push', 'payments')}
                    disabled={!settings.push.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Instant alerts for payment-related activities
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Daily Reports</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.push.dailyReports}
                    onChange={() => handleToggle('push', 'dailyReports')}
                    disabled={!settings.push.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Get push notifications for daily activity updates
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">SMS Notifications</h2>
            
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Enable SMS Notifications</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.sms.enabled}
                  onChange={() => handleToggle('sms', 'enabled')}
                />
              </label>
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Calendar Events</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.sms.events}
                    onChange={() => handleToggle('sms', 'events')}
                    disabled={!settings.sms.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Receive SMS alerts for important events
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Announcements</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.sms.announcements}
                    onChange={() => handleToggle('sms', 'announcements')}
                    disabled={!settings.sms.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Get urgent announcements via SMS
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Payment Notifications</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.sms.payments}
                    onChange={() => handleToggle('sms', 'payments')}
                    disabled={!settings.sms.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  SMS alerts for payment deadlines and confirmations
                </p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Daily Reports</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.sms.dailyReports}
                    onChange={() => handleToggle('sms', 'dailyReports')}
                    disabled={!settings.sms.enabled}
                  />
                </label>
                <p className="text-sm text-base-content/70 pl-2">
                  Get daily updates via SMS
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className={`btn btn-primary ${saving ? 'loading' : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;