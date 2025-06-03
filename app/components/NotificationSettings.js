'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function NotificationSettings({ userId, userRole }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    notifyOnEvents: true,
    notifyOnInvoices: true,
    notifyOnPayments: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'notificationSettings', userId));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading notification settings:', error);
        setError('Failed to load notification settings');
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  // Handle toggle changes
  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'notificationSettings', userId), settings);
      setSaving(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setError('Failed to save notification settings');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading notification settings...</div>;
  }

  return (
    <div className="notification-settings">
      <h2>Notification Settings</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="settings-form">
        <div className="setting-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <span className="toggle-text">Enable Email Notifications</span>
          </label>
          <p className="setting-description">
            Receive important updates via email
          </p>
        </div>

        <div className="setting-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={settings.notifyOnEvents}
              onChange={() => handleToggle('notifyOnEvents')}
              disabled={!settings.emailNotifications}
            />
            <span className="toggle-text">Calendar Events</span>
          </label>
          <p className="setting-description">
            Get notified about new events and schedule changes
          </p>
        </div>

        {userRole === 'parent' && (
          <>
            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.notifyOnInvoices}
                  onChange={() => handleToggle('notifyOnInvoices')}
                  disabled={!settings.emailNotifications}
                />
                <span className="toggle-text">New Invoices</span>
              </label>
              <p className="setting-description">
                Receive notifications when new invoices are generated
              </p>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.notifyOnPayments}
                  onChange={() => handleToggle('notifyOnPayments')}
                  disabled={!settings.emailNotifications}
                />
                <span className="toggle-text">Payment Confirmations</span>
              </label>
              <p className="setting-description">
                Get notified when your payments are processed
              </p>
            </div>
          </>
        )}

        <div className="settings-actions">
          <button 
            className="save-btn"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
} 