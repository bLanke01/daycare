'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
    </div>
  );
} 