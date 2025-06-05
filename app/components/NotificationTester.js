// components/NotificationTester.js
'use client';

import { useState } from 'react';
import { notificationService } from '../services/NotificationService';
import { useAuth } from '../firebase/auth-context';

export default function NotificationTester({ userRole }) {
  const { user } = useAuth();
  const [testType, setTestType] = useState('admin_event');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [customData, setCustomData] = useState({
    eventTitle: 'Test Calendar Event',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: '10:00 AM - 11:00 AM',
    eventGroup: 'All Groups',
    eventDescription: 'This is a test event created for notification testing purposes.',
    invoiceNumber: 'INV-TEST-001',
    childName: 'Test Child',
    totalAmount: '250.00',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const testTypes = {
    admin_event: {
      label: '📅 Admin: New Calendar Event',
      description: 'Test notification sent to admin when a new event is created',
      requiredRole: 'admin'
    },
    parent_event: {
      label: '📅 Parent: New Calendar Event',
      description: 'Test notification sent to parent about a new event',
      requiredRole: 'admin'
    },
    new_invoice: {
      label: '💰 Parent: New Invoice',
      description: 'Test notification sent to parent when a new invoice is created',
      requiredRole: 'admin'
    },
    invoice_paid: {
      label: '✅ Parent: Invoice Paid',
      description: 'Test notification sent to parent when payment is confirmed',
      requiredRole: 'admin'
    }
  };

  const sendTestNotification = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid email address for testing.');
      return;
    }

    setTesting(true);
    const startTime = Date.now();

    try {
      let result;
      const testMetadata = {
        isTest: true,
        testType: testType,
        sentBy: user.email,
        sentAt: new Date().toISOString()
      };

      switch (testType) {
        case 'admin_event':
          result = await notificationService.sendEmail(
            testEmail,
            notificationService.processTemplate(
              notificationService.emailTemplates.NEW_CALENDAR_EVENT.subject,
              { eventTitle: customData.eventTitle }
            ),
            notificationService.processTemplate(
              notificationService.emailTemplates.NEW_CALENDAR_EVENT.template,
              {
                eventTitle: customData.eventTitle,
                eventDate: new Date(customData.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                eventTime: customData.eventTime,
                eventGroup: customData.eventGroup,
                eventDescription: customData.eventDescription,
                dashboardUrl: `${window.location.origin}/admin`
              }
            ),
            { ...testMetadata, type: 'admin_new_event' }
          );
          break;

        case 'parent_event':
          result = await notificationService.sendEmail(
            testEmail,
            notificationService.processTemplate(
              notificationService.emailTemplates.NEW_CALENDAR_EVENT_PARENT.subject,
              { 
                eventTitle: customData.eventTitle,
                childName: customData.childName
              }
            ),
            notificationService.processTemplate(
              notificationService.emailTemplates.NEW_CALENDAR_EVENT_PARENT.template,
              {
                eventTitle: customData.eventTitle,
                childName: customData.childName,
                eventDate: new Date(customData.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                eventTime: customData.eventTime,
                eventGroup: customData.eventGroup,
                eventDescription: customData.eventDescription,
                dashboardUrl: `${window.location.origin}/parent`
              }
            ),
            { ...testMetadata, type: 'parent_new_event' }
          );
          break;

        case 'new_invoice':
          result = await notificationService.sendEmail(
            testEmail,
            notificationService.processTemplate(
              notificationService.emailTemplates.NEW_INVOICE.subject,
              { 
                invoiceNumber: customData.invoiceNumber,
                childName: customData.childName
              }
            ),
            notificationService.processTemplate(
              notificationService.emailTemplates.NEW_INVOICE.template,
              {
                invoiceNumber: customData.invoiceNumber,
                childName: customData.childName,
                totalAmount: customData.totalAmount,
                dueDate: new Date(customData.dueDate).toLocaleDateString(),
                status: 'PENDING',
                paymentEmail: 'payments@daycare.com',
                invoiceUrl: `${window.location.origin}/parent/invoices`,
                dashboardUrl: `${window.location.origin}/parent/messages`
              }
            ),
            { ...testMetadata, type: 'new_invoice' }
          );
          break;

        case 'invoice_paid':
          result = await notificationService.sendEmail(
            testEmail,
            notificationService.processTemplate(
              notificationService.emailTemplates.INVOICE_PAID.subject,
              { invoiceNumber: customData.invoiceNumber }
            ),
            notificationService.processTemplate(
              notificationService.emailTemplates.INVOICE_PAID.template,
              {
                invoiceNumber: customData.invoiceNumber,
                childName: customData.childName,
                totalAmount: customData.totalAmount,
                paidDate: new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                invoiceUrl: `${window.location.origin}/parent/invoices`,
                dashboardUrl: `${window.location.origin}/parent`
              }
            ),
            { ...testMetadata, type: 'invoice_paid' }
          );
          break;

        default:
          throw new Error('Unknown test type');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const testResult = {
        id: Date.now(),
        type: testType,
        email: testEmail,
        success: result.success,
        error: result.error,
        duration: duration,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results

      if (result.success) {
        alert(`✅ Test notification sent successfully!\n\nTo: ${testEmail}\nType: ${testTypes[testType].label}\nDuration: ${duration}ms`);
      } else {
        alert(`❌ Test failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Test notification error:', error);
      const testResult = {
        id: Date.now(),
        type: testType,
        email: testEmail,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [testResult, ...prev.slice(0, 9)]);
      alert(`❌ Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleCustomDataChange = (field, value) => {
    setCustomData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (userRole !== 'admin') {
    return (
      <div className="notification-tester">
        <div className="access-denied">
          <h2>🔒 Access Denied</h2>
          <p>Only administrators can access the notification testing tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-tester">
      <div className="tester-header">
        <h2>🧪 Notification Testing Tool</h2>
        <p className="tester-description">
          Test email notifications to ensure they're working correctly and preview how they'll look to recipients.
        </p>
      </div>

      {/* Warning Notice */}
      <div className="testing-warning">
        <h3>⚠️ Testing Guidelines</h3>
        <ul>
          <li>Use your own email address or test email accounts only</li>
          <li>These are real emails that will be sent to the specified address</li>
          <li>Test emails are clearly marked as test notifications</li>
          <li>Limit testing to avoid spam and unnecessary emails</li>
        </ul>
      </div>

      {/* Test Configuration */}
      <div className="test-config">
        <h3>🎯 Test Configuration</h3>
        
        <div className="config-row">
          <div className="config-group">
            <label>Notification Type:</label>
            <select 
              value={testType} 
              onChange={(e) => setTestType(e.target.value)}
            >
              {Object.entries(testTypes).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="config-description">
              {testTypes[testType]?.description}
            </p>
          </div>

          <div className="config-group">
            <label>Test Email Address:</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to receive test notification"
              required
            />
          </div>
        </div>

        {/* Custom Data Fields */}
        <div className="custom-data">
          <h4>📝 Test Data</h4>
          <p>Customize the data used in the test notification:</p>
          
          {(testType === 'admin_event' || testType === 'parent_event') && (
            <div className="data-fields">
              <div className="field-row">
                <label>Event Title:</label>
                <input
                  type="text"
                  value={customData.eventTitle}
                  onChange={(e) => handleCustomDataChange('eventTitle', e.target.value)}
                />
              </div>
              <div className="field-row">
                <label>Event Date:</label>
                <input
                  type="date"
                  value={customData.eventDate}
                  onChange={(e) => handleCustomDataChange('eventDate', e.target.value)}
                />
              </div>
              <div className="field-row">
                <label>Event Time:</label>
                <input
                  type="text"
                  value={customData.eventTime}
                  onChange={(e) => handleCustomDataChange('eventTime', e.target.value)}
                />
              </div>
              <div className="field-row">
                <label>Group:</label>
                <select
                  value={customData.eventGroup}
                  onChange={(e) => handleCustomDataChange('eventGroup', e.target.value)}
                >
                  <option value="All Groups">All Groups</option>
                  <option value="Infant">Infant</option>
                  <option value="Toddler">Toddler</option>
                  <option value="Pre-K">Pre-K</option>
                </select>
              </div>
              <div className="field-row">
                <label>Description:</label>
                <textarea
                  value={customData.eventDescription}
                  onChange={(e) => handleCustomDataChange('eventDescription', e.target.value)}
                  rows="3"
                />
              </div>
            </div>
          )}

          {(testType === 'new_invoice' || testType === 'invoice_paid') && (
            <div className="data-fields">
              <div className="field-row">
                <label>Invoice Number:</label>
                <input
                  type="text"
                  value={customData.invoiceNumber}
                  onChange={(e) => handleCustomDataChange('invoiceNumber', e.target.value)}
                />
              </div>
              <div className="field-row">
                <label>Child Name:</label>
                <input
                  type="text"
                  value={customData.childName}
                  onChange={(e) => handleCustomDataChange('childName', e.target.value)}
                />
              </div>
              <div className="field-row">
                <label>Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  value={customData.totalAmount}
                  onChange={(e) => handleCustomDataChange('totalAmount', e.target.value)}
                />
              </div>
              {testType === 'new_invoice' && (
                <div className="field-row">
                  <label>Due Date:</label>
                  <input
                    type="date"
                    value={customData.dueDate}
                    onChange={(e) => handleCustomDataChange('dueDate', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {testType === 'parent_event' && (
            <div className="data-fields">
              <div className="field-row">
                <label>Child Name:</label>
                <input
                  type="text"
                  value={customData.childName}
                  onChange={(e) => handleCustomDataChange('childName', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Send Test Button */}
        <div className="test-actions">
          <button 
            className="send-test-btn"
            onClick={sendTestNotification}
            disabled={testing || !testEmail}
          >
            {testing ? (
              <>
                <div className="btn-spinner"></div>
                Sending Test...
              </>
            ) : (
              '📧 Send Test Notification'
            )}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="test-results">
          <h3>📊 Test Results</h3>
          <div className="results-list">
            {results.map(result => (
              <div 
                key={result.id} 
                className={`result-item ${result.success ? 'success' : 'error'}`}
              >
                <div className="result-header">
                  <span className="result-type">
                    {testTypes[result.type]?.label}
                  </span>
                  <span className="result-time">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="result-details">
                  <span className="result-email">To: {result.email}</span>
                  <span className="result-duration">{result.duration}ms</span>
                  <span className={`result-status ${result.success ? 'success' : 'error'}`}>
                    {result.success ? '✅ Success' : `❌ Failed: ${result.error}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testing Tips */}
      <div className="testing-tips">
        <h3>💡 Testing Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>📧 Email Delivery</h4>
            <p>Test emails should arrive within 1-2 minutes. Check spam folders if not received.</p>
          </div>
          <div className="tip-card">
            <h4>📱 Mobile Testing</h4>
            <p>View test emails on mobile devices to ensure responsive design works correctly.</p>
          </div>
          <div className="tip-card">
            <h4>🎨 Content Review</h4>
            <p>Review email content for accuracy, tone, and professional appearance.</p>
          </div>
          <div className="tip-card">
            <h4>🔗 Link Testing</h4>
            <p>Click all links in test emails to ensure they redirect to the correct pages.</p>
          </div>
        </div>
      </div>
    </div>
  );
}