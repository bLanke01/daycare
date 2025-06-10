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
    <div className="container mx-auto p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">⚙️ Parent Account Settings</h1>
              <p className="text-base-content/70">Manage your account preferences, notifications, and privacy settings</p>
            </div>
          </div>

          {/* Settings Navigation */}
          <div className="tabs tabs-boxed mt-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Google Account Linking Section */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <GoogleAccountLinking />
                  </div>
                </div>
                
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">🔒 Privacy Settings</h2>
                    <p className="text-base-content/70">
                      Control how your child's information is shared and displayed within the daycare system.
                    </p>
                    
                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text">📸 Allow Individual Photos</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.privacySettings.shareChildPhotos}
                          onChange={(e) => handlePrivacySettingChange('shareChildPhotos', e.target.checked)}
                        />
                      </label>
                      <p className="text-sm text-base-content/70 ml-2">
                        Allow daycare staff to take and share individual photos of your child with you
                      </p>
                    </div>

                    <div className="form-control mt-4">
                      <label className="label cursor-pointer">
                        <span className="label-text">👥 Include in Group Photos</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.privacySettings.allowChildInGroupPhotos}
                          onChange={(e) => handlePrivacySettingChange('allowChildInGroupPhotos', e.target.checked)}
                        />
                      </label>
                      <p className="text-sm text-base-content/70 ml-2">
                        Allow your child to be included in group activity photos and class pictures
                      </p>
                    </div>

                    <div className="form-control mt-4">
                      <label className="label cursor-pointer">
                        <span className="label-text">📊 Share Progress Reports</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.privacySettings.shareProgressReports}
                          onChange={(e) => handlePrivacySettingChange('shareProgressReports', e.target.checked)}
                        />
                      </label>
                      <p className="text-sm text-base-content/70 ml-2">
                        Allow daycare staff to share detailed progress reports and developmental milestones
                      </p>
                    </div>

                    <div className="alert alert-info mt-6">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-bold">🛡️ Your Privacy is Protected</h4>
                        <ul className="list-disc list-inside text-sm mt-2">
                          <li>Photos are never shared outside the daycare system</li>
                          <li>Only authorized staff and parents can view child information</li>
                          <li>All data is securely encrypted and stored</li>
                          <li>You can change these settings at any time</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">👶 Child Information Display</h2>
                    <div className="mt-4">
                      <h3 className="font-bold mb-2">Dashboard Preferences</h3>
                      <p className="text-base-content/70 mb-4">Choose what information is prominently displayed on your dashboard:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input type="checkbox" className="checkbox" defaultChecked />
                          <span className="label-text">Today's Activities</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input type="checkbox" className="checkbox" defaultChecked />
                          <span className="label-text">Meal Reports</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input type="checkbox" className="checkbox" defaultChecked />
                          <span className="label-text">Nap Times</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input type="checkbox" className="checkbox" defaultChecked />
                          <span className="label-text">Attendance Status</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input type="checkbox" className="checkbox" />
                          <span className="label-text">Weekly Summary</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input type="checkbox" className="checkbox" />
                          <span className="label-text">Upcoming Events</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="card bg-base-200">
                  <div className="card-body">
                    <NotificationSettings />
                  </div>
                </div>
                
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">📱 Additional Notification Options</h2>
                    
                    <div className="form-control mt-4">
                      <label className="label cursor-pointer">
                        <span className="label-text">📅 Daily Summary Emails</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.dailyUpdates}
                          onChange={(e) => handleSettingChange('dailyUpdates', e.target.checked)}
                        />
                      </label>
                      <p className="text-sm text-base-content/70 ml-2">
                        Receive a daily summary of your child's activities, meals, and notes at the end of each day
                      </p>
                    </div>

                    <div className="form-control mt-4">
                      <label className="label cursor-pointer">
                        <span className="label-text">📊 Weekly Progress Reports</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.weeklyReports}
                          onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                        />
                      </label>
                      <p className="text-sm text-base-content/70 ml-2">
                        Receive detailed weekly progress reports with developmental milestones and achievements
                      </p>
                    </div>

                    <div className="divider"></div>

                    <h3 className="font-bold mb-4">✨ Why Email Notifications Matter</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <h4 className="card-title text-lg">🕐 Stay Informed</h4>
                          <p>Know immediately when important events are scheduled or changes occur.</p>
                        </div>
                      </div>
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <h4 className="card-title text-lg">💰 Never Miss Payments</h4>
                          <p>Get notified about new invoices and payment confirmations to stay on top of billing.</p>
                        </div>
                      </div>
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <h4 className="card-title text-lg">🎉 Celebrate Achievements</h4>
                          <p>Be the first to know about your child's milestones and special moments.</p>
                        </div>
                      </div>
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <h4 className="card-title text-lg">📱 Mobile Friendly</h4>
                          <p>All emails are designed to look great on your phone, tablet, or computer.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'communication' && (
              <div className="space-y-6">
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">💬 Communication Preferences</h2>
                    
                    <div className="form-control mt-4">
                      <label className="label">
                        <span className="label-text">Preferred Communication Method</span>
                      </label>
                      <select
                        className="select select-bordered w-full max-w-xs"
                        value={settings.communicationPreference}
                        onChange={(e) => handleSettingChange('communicationPreference', e.target.value)}
                      >
                        <option value="email">📧 Email Only</option>
                        <option value="sms">📱 SMS Only</option>
                        <option value="both">📧📱 Both Email & SMS</option>
                        <option value="urgent-sms">📧 Email + SMS for Urgent</option>
                      </select>
                      <p className="text-sm text-base-content/70 mt-2">
                        Choose how you would like to receive communications from the daycare
                      </p>
                    </div>

                    <div className="form-control mt-4">
                      <label className="label">
                        <span className="label-text">Language</span>
                      </label>
                      <select
                        className="select select-bordered w-full max-w-xs"
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="fr">🇫🇷 Français</option>
                      </select>
                      <p className="text-sm text-base-content/70 mt-2">
                        Select your preferred language for all communications
                      </p>
                    </div>

                    <div className="form-control mt-4">
                      <label className="label cursor-pointer">
                        <span className="label-text">📱 Enable SMS Notifications</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.smsNotifications}
                          onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                        />
                      </label>
                      <p className="text-sm text-base-content/70 ml-2">
                        Receive urgent notifications and reminders via SMS text messages
                      </p>
                    </div>

                    <div className="divider"></div>

                    <h3 className="font-bold mb-4">💡 Communication Tips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <p><strong>📧 Email:</strong> Best for detailed information, invoices, and non-urgent updates</p>
                        </div>
                      </div>
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <p><strong>📱 SMS:</strong> Perfect for urgent alerts, pickup reminders, and quick confirmations</p>
                        </div>
                      </div>
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <p><strong>💬 In-App Messages:</strong> Great for ongoing conversations with daycare staff</p>
                        </div>
                      </div>
                      <div className="card bg-base-100">
                        <div className="card-body">
                          <p><strong>📞 Phone Calls:</strong> Reserved for emergencies and urgent matters only</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">🎯 Notification Timing</h2>
                    <div className="mt-4">
                      <h3 className="font-bold mb-4">When would you like to receive notifications?</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Daily Summaries</span>
                          </label>
                          <select className="select select-bordered w-full" defaultValue="evening">
                            <option value="morning">Morning (8:00 AM)</option>
                            <option value="afternoon">Afternoon (3:00 PM)</option>
                            <option value="evening">Evening (6:00 PM)</option>
                          </select>
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Weekly Reports</span>
                          </label>
                          <select className="select select-bordered w-full" defaultValue="sunday">
                            <option value="friday">Friday Evening</option>
                            <option value="saturday">Saturday Morning</option>
                            <option value="sunday">Sunday Evening</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <Suspense fallback={
                    <div className="flex justify-center items-center p-8">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  }>
                    <NotificationHistory userId={user?.uid} userRole="parent" />
                  </Suspense>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}