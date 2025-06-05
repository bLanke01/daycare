// components/NotificationSettings.js - Updated with new notification types
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
  const [success, setSuccess] = useState('');

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'notificationSettings', userId));
        if (settingsDoc.exists()) {
          setSettings({ ...settings, ...settingsDoc.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading notification settings:', error);
        setError('Failed to load notification settings');
        setLoading(false);
      }
    };

    if (userId) {
      loadSettings();
    }
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
    setError(null);
    
    try {
      await setDoc(doc(db, 'notificationSettings', userId), {
        ...settings,
        updatedAt: new Date().toISOString(),
        userId: userId,
        userRole: userRole
      });
      
      setSuccess('✅ Notification settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setError('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading notification settings...</div>;
  }

  return (
    <div className="notification-settings">
      <h2>📧 Email Notification Settings</h2>
      <p className="settings-description">
        Choose what notifications you'd like to receive via email. 
        You can change these settings at any time.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="settings-form">
        {/* Master Email Toggle */}
        <div className="setting-item master-setting">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <span className="toggle-switch"></span>
            <span className="toggle-text">
              <strong>📧 Enable Email Notifications</strong>
            </span>
          </label>
          <p className="setting-description">
            Master setting to receive important updates via email. 
            {settings.emailNotifications ? 
              'You will receive notifications based on your preferences below.' : 
              'All email notifications are disabled.'
            }
          </p>
        </div>

        {/* Calendar Events */}
        <div className="setting-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={settings.notifyOnEvents}
              onChange={() => handleToggle('notifyOnEvents')}
              disabled={!settings.emailNotifications}
            />
            <span className="toggle-switch"></span>
            <span className="toggle-text">
              📅 Calendar Events & Activities
            </span>
          </label>
          <p className="setting-description">
            {userRole === 'admin' ? 
              'Get notified when new events are created in the calendar system. Includes suggestions for additional notifications that may be needed.' :
              'Receive notifications about new events, activities, and schedule changes that affect your child.'
            }
          </p>
          <div className="notification-examples">
            <strong>You'll be notified about:</strong>
            <ul>
              <li>• New calendar events</li>
              <li>• Special activities and field trips</li>
              <li>• Schedule changes or updates</li>
              {userRole === 'admin' && <li>• Notification suggestions for related events</li>}
            </ul>
          </div>
        </div>

        {/* Parent-specific settings */}
        {userRole === 'parent' && (
          <>
            {/* Invoice Notifications */}
            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.notifyOnInvoices}
                  onChange={() => handleToggle('notifyOnInvoices')}
                  disabled={!settings.emailNotifications}
                />
                <span className="toggle-switch"></span>
                <span className="toggle-text">
                  💰 New Invoices & Billing
                </span>
              </label>
              <p className="setting-description">
                Receive notifications when new invoices are generated for your account.
                Essential for staying on top of your daycare billing.
              </p>
              <div className="notification-examples">
                <strong>You'll be notified about:</strong>
                <ul>
                  <li>• New invoices with complete details</li>
                  <li>• Payment instructions and e-transfer information</li>
                  <li>• Due dates and payment reminders</li>
                  <li>• Direct links to view invoices online</li>
                </ul>
              </div>
            </div>

            {/* Payment Confirmations */}
            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.notifyOnPayments}
                  onChange={() => handleToggle('notifyOnPayments')}
                  disabled={!settings.emailNotifications}
                />
                <span className="toggle-switch"></span>
                <span className="toggle-text">
                  ✅ Payment Confirmations
                </span>
              </label>
              <p className="setting-description">
                Get notified when your payments are received and processed by the daycare.
                Provides peace of mind and record keeping.
              </p>
              <div className="notification-examples">
                <strong>You'll be notified when:</strong>
                <ul>
                  <li>• Your payment is marked as received</li>
                  <li>• Invoice status changes to "Paid"</li>
                  <li>• Payment processing is complete</li>
                  <li>• Receipt is available for download</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Admin-specific settings */}
        {userRole === 'admin' && (
          <div className="admin-notification-extras">
            <h3>🔧 Additional Admin Notifications</h3>
            <p>As an administrator, you may also want to consider setting up notifications for:</p>
            <ul className="suggestion-list">
              <li>📋 New parent registrations and requests</li>
              <li>👶 Child attendance tracking alerts</li>
              <li>💬 New messages from parents</li>
              <li>📊 Weekly/monthly reports and summaries</li>
              <li>🚨 System alerts and maintenance notifications</li>
            </ul>
            <p><small>These additional notification types can be configured in the main Admin Settings panel.</small></p>
          </div>
        )}

        {/* Email Preview */}
        {settings.emailNotifications && (
          <div className="email-preview-section">
            <h3>📧 What Your Emails Will Look Like</h3>
            <p>Our notification emails are designed to be clear, informative, and professional:</p>
            <div className="email-features">
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Mobile-friendly design</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔗</span>
                <span>Direct links to relevant pages</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📝</span>
                <span>Complete information included</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎨</span>
                <span>Professional, easy-to-read format</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="settings-actions">
          <button 
            className="save-btn"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="btn-spinner"></div>
                Saving Settings...
              </>
            ) : (
              '💾 Save Notification Settings'
            )}
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <h4>🔒 Privacy & Email Security</h4>
          <ul>
            <li>We never share your email address with third parties</li>
            <li>All emails are sent securely and contain only relevant information</li>
            <li>You can unsubscribe or modify these settings at any time</li>
            <li>Urgent safety notifications may still be sent even if notifications are disabled</li>
          </ul>
        </div>

        {/* Email Frequency Info */}
        <div className="frequency-info">
          <h4>📬 Email Frequency</h4>
          <div className="frequency-grid">
            <div className="frequency-item">
              <strong>Calendar Events:</strong>
              <span>As they're created (typically 1-3 per week)</span>
            </div>
            {userRole === 'parent' && (
              <>
                <div className="frequency-item">
                  <strong>Invoices:</strong>
                  <span>Monthly or as billed</span>
                </div>
                <div className="frequency-item">
                  <strong>Payment Confirmations:</strong>
                  <span>Within 24 hours of payment processing</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}