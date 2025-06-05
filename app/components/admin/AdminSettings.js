// components/admin/AdminSettings.js - Updated with comprehensive notification settings
'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import GoogleAccountLinking from './AdminGoogleAccountLinking';
import NotificationSettings from '../NotificationSettings';
import { useAuth } from '../../firebase/auth-context';

// Lazy load these components to avoid import errors
import { lazy, Suspense } from 'react';

const NotificationHistory = lazy(() => import('../NotificationHistory'));
const NotificationTester = lazy(() => import('../NotificationTester'));

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoApproveRequests: false,
    darkMode: false,
    language: 'en',
    requireTwoFactor: false,
    sessionTimeout: true,
    showAdvancedFeatures: false,
    defaultNewUserView: 'pending',
    backupFrequency: 'weekly'
  });

  const [activeTab, setActiveTab] = useState('account');

  const handleSettingChange = async (setting, value) => {
    try {
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
      
      // Update settings in Firestore
      // const userSettingsRef = doc(db, 'adminSettings', user.uid);
      // await updateDoc(userSettingsRef, {
      //   [setting]: value,
      //   updatedAt: new Date().toISOString()
      // });
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  const tabs = [
    { id: 'account', label: 'Account & Security', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '📧' },
    { id: 'system', label: 'System Preferences', icon: '⚙️' },
    { id: 'history', label: 'Notification History', icon: '📜' },
    { id: 'testing', label: 'Test Notifications', icon: '🧪' }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>🔧 Admin Settings</h1>
        <p>Manage your administrative preferences, notifications, and system settings</p>
      </div>
      
      {/* Settings Navigation */}
      <div className="settings-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {activeTab === 'account' && (
          <div className="tab-content">
            {/* Google Account Linking Section */}
            <section className="settings-section">
              <GoogleAccountLinking />
            </section>
            
            <section className="settings-section">
              <h2>🔒 Security & Access</h2>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.requireTwoFactor}
                    onChange={(e) => handleSettingChange('requireTwoFactor', e.target.checked)}
                  />
                  Require Two-Factor Authentication
                </label>
                <p className="setting-description">
                  Enhance security by requiring two-factor authentication for admin accounts
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', e.target.checked)}
                  />
                  Auto-logout After Inactivity
                </label>
                <p className="setting-description">
                  Automatically log out admin users after 30 minutes of inactivity
                </p>
              </div>
            </section>

            <section className="settings-section">
              <h2>🎛️ Administrative Preferences</h2>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.showAdvancedFeatures}
                    onChange={(e) => handleSettingChange('showAdvancedFeatures', e.target.checked)}
                  />
                  Show Advanced Features
                </label>
                <p className="setting-description">
                  Display advanced administrative tools and options in the dashboard
                </p>
              </div>

              <div className="setting-item">
                <label>Default View for New Users</label>
                <select
                  value={settings.defaultNewUserView}
                  onChange={(e) => handleSettingChange('defaultNewUserView', e.target.value)}
                >
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Auto-Approved</option>
                  <option value="review">Manual Review</option>
                </select>
                <p className="setting-description">
                  Set the default status for new parent registrations
                </p>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="tab-content">
            <NotificationSettings userId={user?.uid} userRole="admin" />
            
            <section className="settings-section">
              <h2>🔔 Admin-Specific Notification Settings</h2>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.autoApproveRequests}
                    onChange={(e) => handleSettingChange('autoApproveRequests', e.target.checked)}
                  />
                  Auto-approve Parent Requests
                </label>
                <p className="setting-description">
                  Automatically approve parent registration requests (disables new user notifications)
                </p>
              </div>

              <div className="admin-notification-tips">
                <h3>💡 Notification Best Practices for Admins</h3>
                <div className="tips-grid">
                  <div className="tip-card">
                    <h4>📅 Calendar Events</h4>
                    <p>Get notified when you create events plus suggestions for related notifications you might want to send.</p>
                  </div>
                  <div className="tip-card">
                    <h4>📊 Weekly Summaries</h4>
                    <p>Consider setting up weekly summary emails to track system activity and parent engagement.</p>
                  </div>
                  <div className="tip-card">
                    <h4>🚨 System Alerts</h4>
                    <p>Enable critical system notifications for security, backup status, and maintenance updates.</p>
                  </div>
                  <div className="tip-card">
                    <h4>👥 Parent Communication</h4>
                    <p>Get notified when parents send messages or submit important requests requiring attention.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="tab-content">
            <section className="settings-section">
              <h2>🎨 System Preferences</h2>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  />
                  Dark Mode
                </label>
                <p className="setting-description">
                  Enable dark mode for the admin dashboard
                </p>
              </div>

              <div className="setting-item">
                <label>Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
                <p className="setting-description">
                  Select your preferred language
                </p>
              </div>

              <div className="setting-item">
                <label>Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="setting-description">
                  How often to automatically backup system data
                </p>
              </div>
            </section>

            <section className="settings-section">
              <h2>📊 Dashboard Configuration</h2>
              <div className="dashboard-config">
                <h3>Default Dashboard Widgets</h3>
                <p>Choose which widgets are displayed by default on the admin dashboard:</p>
                <div className="widget-options">
                  <label><input type="checkbox" defaultChecked /> Today's Attendance Summary</label>
                  <label><input type="checkbox" defaultChecked /> Recent Activities</label>
                  <label><input type="checkbox" defaultChecked /> Pending Invoices</label>
                  <label><input type="checkbox" defaultChecked /> Quick Actions</label>
                  <label><input type="checkbox" /> Parent Messages</label>
                  <label><input type="checkbox" /> System Status</label>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <Suspense fallback={<div className="loading">Loading notification history...</div>}>
              <NotificationHistory userId={user?.uid} userRole="admin" />
            </Suspense>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="tab-content">
            <Suspense fallback={<div className="loading">Loading notification tester...</div>}>
              <NotificationTester userRole="admin" />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}