// components/parent/ParentSettings.js - Updated with comprehensive notification settings
'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import GoogleAccountLinking from './GoogleAccountLinking';
import NotificationSettings from '../NotificationSettings';
import { useAuth } from '../../firebase/auth-context';

// Lazy load to avoid import errors
import { lazy, Suspense } from 'react';

const NotificationHistory = lazy(() => import('../NotificationHistory'));

export default function ParentSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    dailyUpdates: true,
    weeklyReports: true,
    language: 'en',
    communicationPreference: 'email',
    sharePhotos: true,
    privacySettings: {
      shareChildPhotos: true,
      allowChildInGroupPhotos: true,
      shareProgressReports: true
    }
  });

  const [activeTab, setActiveTab] = useState('account');

  const handleSettingChange = async (setting, value) => {
    try {
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
      
      // Update settings in Firestore
      // const userSettingsRef = doc(db, 'parentSettings', user.uid);
      // await updateDoc(userSettingsRef, {
      //   [setting]: value,
      //   updatedAt: new Date().toISOString()
      // });
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  const handlePrivacySettingChange = async (setting, value) => {
    try {
      const newPrivacySettings = {
        ...settings.privacySettings,
        [setting]: value
      };
      
      setSettings(prev => ({
        ...prev,
        privacySettings: newPrivacySettings
      }));
      
      // Update in Firestore
      // const userSettingsRef = doc(db, 'parentSettings', user.uid);
      // await updateDoc(userSettingsRef, {
      //   privacySettings: newPrivacySettings,
      //   updatedAt: new Date().toISOString()
      // });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      alert('Failed to update privacy settings. Please try again.');
    }
  };

  const tabs = [
    { id: 'account', label: 'Account & Privacy', icon: '👤' },
    { id: 'notifications', label: 'Email Notifications', icon: '📧' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'history', label: 'Notification History', icon: '📜' }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Parent Account Settings</h1>
        <p>Manage your account preferences, notifications, and privacy settings</p>
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
              <h2>🔒 Privacy Settings</h2>
              <p className="section-description">
                Control how your child's information is shared and displayed within the daycare system.
              </p>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.privacySettings.shareChildPhotos}
                    onChange={(e) => handlePrivacySettingChange('shareChildPhotos', e.target.checked)}
                  />
                  📸 Allow Individual Photos
                </label>
                <p className="setting-description">
                  Allow daycare staff to take and share individual photos of your child with you
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.privacySettings.allowChildInGroupPhotos}
                    onChange={(e) => handlePrivacySettingChange('allowChildInGroupPhotos', e.target.checked)}
                  />
                  👥 Include in Group Photos
                </label>
                <p className="setting-description">
                  Allow your child to be included in group activity photos and class pictures
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.privacySettings.shareProgressReports}
                    onChange={(e) => handlePrivacySettingChange('shareProgressReports', e.target.checked)}
                  />
                  📊 Share Progress Reports
                </label>
                <p className="setting-description">
                  Allow daycare staff to share detailed progress reports and developmental milestones
                </p>
              </div>

              <div className="privacy-note">
                <h4>🛡️ Your Privacy is Protected</h4>
                <ul>
                  <li>Photos are never shared outside the daycare system</li>
                  <li>Only authorized staff and parents can view child information</li>
                  <li>All data is securely encrypted and stored</li>
                  <li>You can change these settings at any time</li>
                </ul>
              </div>
            </section>

            <section className="settings-section">
              <h2>👶 Child Information Display</h2>
              <div className="display-preferences">
                <h3>Dashboard Preferences</h3>
                <p>Choose what information is prominently displayed on your dashboard:</p>
                <div className="display-options">
                  <label><input type="checkbox" defaultChecked /> Today's Activities</label>
                  <label><input type="checkbox" defaultChecked /> Meal Reports</label>
                  <label><input type="checkbox" defaultChecked /> Nap Times</label>
                  <label><input type="checkbox" defaultChecked /> Attendance Status</label>
                  <label><input type="checkbox" /> Weekly Summary</label>
                  <label><input type="checkbox" /> Upcoming Events</label>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="tab-content">
            <NotificationSettings userId={user?.uid} userRole="parent" />
            
            <section className="settings-section">
              <h2>📱 Additional Notification Options</h2>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.dailyUpdates}
                    onChange={(e) => handleSettingChange('dailyUpdates', e.target.checked)}
                  />
                  📅 Daily Summary Emails
                </label>
                <p className="setting-description">
                  Receive a daily summary of your child's activities, meals, and notes at the end of each day
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.weeklyReports}
                    onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                  />
                  📊 Weekly Progress Reports
                </label>
                <p className="setting-description">
                  Receive detailed weekly progress reports with developmental milestones and achievements
                </p>
              </div>

              <div className="parent-notification-benefits">
                <h3>✨ Why Email Notifications Matter</h3>
                <div className="benefits-grid">
                  <div className="benefit-card">
                    <h4>🕐 Stay Informed</h4>
                    <p>Know immediately when important events are scheduled or changes occur.</p>
                  </div>
                  <div className="benefit-card">
                    <h4>💰 Never Miss Payments</h4>
                    <p>Get notified about new invoices and payment confirmations to stay on top of billing.</p>
                  </div>
                  <div className="benefit-card">
                    <h4>🎉 Celebrate Achievements</h4>
                    <p>Be the first to know about your child's milestones and special moments.</p>
                  </div>
                  <div className="benefit-card">
                    <h4>📱 Mobile Friendly</h4>
                    <p>All emails are designed to look great on your phone, tablet, or computer.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="tab-content">
            <section className="settings-section">
              <h2>💬 Communication Preferences</h2>
              
              <div className="setting-item">
                <label>Preferred Communication Method</label>
                <select
                  value={settings.communicationPreference}
                  onChange={(e) => handleSettingChange('communicationPreference', e.target.value)}
                >
                  <option value="email">📧 Email Only</option>
                  <option value="sms">📱 SMS Only</option>
                  <option value="both">📧📱 Both Email & SMS</option>
                  <option value="urgent-sms">📧 Email + SMS for Urgent</option>
                </select>
                <p className="setting-description">
                  Choose how you would like to receive communications from the daycare
                </p>
              </div>

              <div className="setting-item">
                <label>Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="fr">🇫🇷 Français</option>
                </select>
                <p className="setting-description">
                  Select your preferred language for all communications
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                  />
                  📱 Enable SMS Notifications
                </label>
                <p className="setting-description">
                  Receive urgent notifications and reminders via SMS text messages
                </p>
              </div>

              <div className="communication-tips">
                <h3>💡 Communication Tips</h3>
                <div className="tips-list">
                  <div className="tip-item">
                    <strong>📧 Email:</strong> Best for detailed information, invoices, and non-urgent updates
                  </div>
                  <div className="tip-item">
                    <strong>📱 SMS:</strong> Perfect for urgent alerts, pickup reminders, and quick confirmations
                  </div>
                  <div className="tip-item">
                    <strong>💬 In-App Messages:</strong> Great for ongoing conversations with daycare staff
                  </div>
                  <div className="tip-item">
                    <strong>📞 Phone Calls:</strong> Reserved for emergencies and urgent matters only
                  </div>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h2>🎯 Notification Timing</h2>
              <div className="timing-preferences">
                <h3>When would you like to receive notifications?</h3>
                <div className="timing-options">
                  <div className="timing-item">
                    <label>Daily Summaries</label>
                    <select defaultValue="evening">
                      <option value="morning">Morning (8:00 AM)</option>
                      <option value="afternoon">Afternoon (3:00 PM)</option>
                      <option value="evening">Evening (6:00 PM)</option>
                    </select>
                  </div>
                  <div className="timing-item">
                    <label>Weekly Reports</label>
                    <select defaultValue="sunday">
                      <option value="friday">Friday Evening</option>
                      <option value="saturday">Saturday Morning</option>
                      <option value="sunday">Sunday Evening</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <Suspense fallback={<div className="loading">Loading notification history...</div>}>
              <NotificationHistory userId={user?.uid} userRole="parent" />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}