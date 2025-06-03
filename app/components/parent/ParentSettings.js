// components/parent/ParentSettings.js - Updated with Google Account Linking
'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import GoogleAccountLinking from './GoogleAccountLinking'; // Import the new component

export default function ParentSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    dailyUpdates: true,
    weeklyReports: true,
    language: 'en',
    communicationPreference: 'email'
  });

  const handleSettingChange = async (setting, value) => {
    try {
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
      
      // Update settings in Firestore (you'll need to implement this with your user system)
      // const userSettingsRef = doc(db, 'parentSettings', userId);
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
      <h1>Parent Account Settings</h1>
      
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
            Receive important updates and announcements via email
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
            />
            SMS Notifications
          </label>
          <p className="setting-description">
            Receive urgent notifications via SMS
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.dailyUpdates}
              onChange={(e) => handleSettingChange('dailyUpdates', e.target.checked)}
            />
            Daily Updates
          </label>
          <p className="setting-description">
            Receive daily updates about your child's activities
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.weeklyReports}
              onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
            />
            Weekly Reports
          </label>
          <p className="setting-description">
            Receive detailed weekly progress reports
          </p>
        </div>
      </section>

      <section className="settings-section">
        <h2>Communication Preferences</h2>
        <div className="setting-item">
          <label>Preferred Communication Method</label>
          <select
            value={settings.communicationPreference}
            onChange={(e) => handleSettingChange('communicationPreference', e.target.value)}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Both Email & SMS</option>
          </select>
          <p className="setting-description">
            Choose how you would like to receive communications from us
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
            Select your preferred language for communications
          </p>
        </div>
      </section>

      <section className="settings-section">
        <h2>Privacy</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.sharePhotos}
              onChange={(e) => handleSettingChange('sharePhotos', e.target.checked)}
            />
            Photo Sharing Permission
          </label>
          <p className="setting-description">
            Allow the daycare to share photos of your child in group activities
          </p>
        </div>
      </section>
    </div>
  );
}