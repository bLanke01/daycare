// components/admin/AdminSettings.js - Updated with Google Account Linking
'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import GoogleAccountLinking from './AdminGoogleAccountLinking'; // Use admin-specific component

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoApproveRequests: false,
    darkMode: false,
    language: 'en',
  });

  const handleSettingChange = async (setting, value) => {
    try {
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
      
      // Update settings in Firestore (you'll need to implement this with your user system)
      // const userSettingsRef = doc(db, 'adminSettings', userId);
      // await updateDoc(userSettingsRef, {
      //   [setting]: value
      // });
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  return (
    <div className="settings-container">
      <h1>Admin Settings</h1>
      
      {/* NEW: Google Account Linking Section */}
      <section className="settings-section">
        <GoogleAccountLinking />
      </section>
      
      <section className="settings-section">
        <h2>Notifications</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            />
            Email Notifications
          </label>
          <p className="setting-description">
            Receive email notifications for new registrations and important updates
          </p>
        </div>
      </section>

      <section className="settings-section">
        <h2>System Preferences</h2>
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
            Automatically approve parent registration requests
          </p>
        </div>

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
      </section>

      <section className="settings-section">
        <h2>Security & Access</h2>
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
        <h2>Administrative Preferences</h2>
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
    </div>
  );
}