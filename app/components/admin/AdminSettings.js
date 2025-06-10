// components/admin/AdminSettings.js - Updated with comprehensive notification settings
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
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
    daycare: {
      name: '',
      address: '',
      phone: '',
      email: '',
      openingHours: {
        start: '07:00',
        end: '18:00'
      },
      maxCapacity: 50,
      ageGroups: {
        infant: { min: 0, max: 18 },
        toddler: { min: 19, max: 35 },
        preschool: { min: 36, max: 60 }
      }
    },
    notifications: {
      enableEmailNotifications: true,
      enablePushNotifications: false,
      notifyOnChildCheckIn: true,
      notifyOnChildCheckOut: true,
      notifyOnIncident: true,
      notifyOnAnnouncement: true
    },
    billing: {
      currency: 'USD',
      lateFeeAmount: 25,
      gracePeriod: 15, // minutes
      autoGenerateInvoices: true,
      paymentDueDay: 1
    },
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('daycare');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'daycare'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateDoc(doc(db, 'settings', 'daycare'), settings);
      setSuccess('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

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
    { id: 'daycare', label: 'Daycare Info', icon: '🏢' },
    { id: 'notifications', label: 'Notifications', icon: '📧' },
    { id: 'billing', label: 'Billing', icon: '💵' },
    { id: 'system', label: 'System Preferences', icon: '⚙️' },
    { id: 'history', label: 'Notification History', icon: '📜' },
    { id: 'testing', label: 'Test Notifications', icon: '🧪' }
  ];

  if (loading && !settings) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content mb-8">🔧 Admin Settings</h1>

        {error && (
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className="tabs tabs-boxed">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSettingsUpdate} className="space-y-6">
          {/* Daycare Info Settings */}
          {activeTab === 'daycare' && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Daycare Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Daycare Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.daycare.name}
                      onChange={(e) => handleInputChange('daycare', 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full"
                      value={settings.daycare.email}
                      onChange={(e) => handleInputChange('daycare', 'email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Phone</span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered w-full"
                      value={settings.daycare.phone}
                      onChange={(e) => handleInputChange('daycare', 'phone', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Maximum Capacity</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={settings.daycare.maxCapacity}
                      onChange={(e) => handleInputChange('daycare', 'maxCapacity', parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Address</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={settings.daycare.address}
                    onChange={(e) => handleInputChange('daycare', 'address', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Opening Time</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={settings.daycare.openingHours.start}
                      onChange={(e) => handleInputChange('daycare', 'openingHours', {
                        ...settings.daycare.openingHours,
                        start: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Closing Time</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={settings.daycare.openingHours.end}
                      onChange={(e) => handleInputChange('daycare', 'openingHours', {
                        ...settings.daycare.openingHours,
                        end: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Enable Email Notifications</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings.notifications.enableEmailNotifications}
                        onChange={(e) => handleInputChange('notifications', 'enableEmailNotifications', e.target.checked)}
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Enable Push Notifications</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings.notifications.enablePushNotifications}
                        onChange={(e) => handleInputChange('notifications', 'enablePushNotifications', e.target.checked)}
                      />
                    </label>
                  </div>

                  <div className="divider">Notification Events</div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Child Check-in</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={settings.notifications.notifyOnChildCheckIn}
                        onChange={(e) => handleInputChange('notifications', 'notifyOnChildCheckIn', e.target.checked)}
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Child Check-out</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={settings.notifications.notifyOnChildCheckOut}
                        onChange={(e) => handleInputChange('notifications', 'notifyOnChildCheckOut', e.target.checked)}
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Incidents</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-warning"
                        checked={settings.notifications.notifyOnIncident}
                        onChange={(e) => handleInputChange('notifications', 'notifyOnIncident', e.target.checked)}
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Announcements</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-info"
                        checked={settings.notifications.notifyOnAnnouncement}
                        onChange={(e) => handleInputChange('notifications', 'notifyOnAnnouncement', e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Billing Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Currency</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={settings.billing.currency}
                      onChange={(e) => handleInputChange('billing', 'currency', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Late Fee Amount</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="input input-bordered w-full"
                        value={settings.billing.lateFeeAmount}
                        onChange={(e) => handleInputChange('billing', 'lateFeeAmount', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        required
                      />
                      <span>{settings.billing.currency}</span>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Grace Period (minutes)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={settings.billing.gracePeriod}
                      onChange={(e) => handleInputChange('billing', 'gracePeriod', parseInt(e.target.value))}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Payment Due Day</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={settings.billing.paymentDueDay}
                      onChange={(e) => handleInputChange('billing', 'paymentDueDay', parseInt(e.target.value))}
                      min="1"
                      max="31"
                      required
                    />
                  </div>
                </div>

                <div className="form-control mt-4">
                  <label className="label cursor-pointer">
                    <span className="label-text">Auto-generate Monthly Invoices</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.billing.autoGenerateInvoices}
                      onChange={(e) => handleInputChange('billing', 'autoGenerateInvoices', e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* System Preferences */}
          {activeTab === 'system' && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">System Preferences</h2>
                
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Dark Mode</span>
                    </label>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Language</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Backup Frequency</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={settings.backupFrequency}
                      onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="divider"></div>

                  <GoogleAccountLinking />
                </div>
              </div>
            </div>
          )}

          {/* Notification History */}
          {activeTab === 'history' && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Notification History</h2>
                
                <Suspense fallback={<div className="loading">Loading notification history...</div>}>
                  <NotificationHistory userId={user?.uid} userRole="admin" />
                </Suspense>
              </div>
            </div>
          )}

          {/* Notification Tester */}
          {activeTab === 'testing' && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Test Notifications</h2>
                
                <Suspense fallback={<div className="loading">Loading notification tester...</div>}>
                  <NotificationTester userRole="admin" />
                </Suspense>
              </div>
            </div>
          )}

          <div className="card-actions justify-end">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}