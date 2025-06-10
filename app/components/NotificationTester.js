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
      <div className="card bg-base-100 shadow-xl p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">🔒 Access Denied</h2>
          <p className="text-error">Only administrators can access the notification testing tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content">
          <span className="text-primary">Notification</span> Tester
        </h1>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Send Test Notification</h2>

            <form onSubmit={sendTestNotification} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notification Type</span>
                </label>
                <select
                  className="select select-bordered"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  required
                >
                  {Object.entries(testTypes).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Test Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter test recipient email"
                  className="input input-bordered"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  required
                />
              </div>

              <div className="divider">Custom Data</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Event Title</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={customData.eventTitle}
                    onChange={(e) => handleCustomDataChange('eventTitle', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Event Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={customData.eventDate}
                    onChange={(e) => handleCustomDataChange('eventDate', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Event Time</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={customData.eventTime}
                    onChange={(e) => handleCustomDataChange('eventTime', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Event Group</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={customData.eventGroup}
                    onChange={(e) => handleCustomDataChange('eventGroup', e.target.value)}
                  />
                </div>

                <div className="form-control col-span-2">
                  <label className="label">
                    <span className="label-text">Event Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={customData.eventDescription}
                    onChange={(e) => handleCustomDataChange('eventDescription', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Invoice Number</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={customData.invoiceNumber}
                    onChange={(e) => handleCustomDataChange('invoiceNumber', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Child Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={customData.childName}
                    onChange={(e) => handleCustomDataChange('childName', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Total Amount</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={customData.totalAmount}
                    onChange={(e) => handleCustomDataChange('totalAmount', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Due Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={customData.dueDate}
                    onChange={(e) => handleCustomDataChange('dueDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="reset"
                  className="btn btn-ghost"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${testing ? 'loading' : ''}`}
                  disabled={testing || !testEmail}
                >
                  {testing ? 'Sending...' : 'Send Test Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Important Notes</h2>
            <div className="space-y-2">
              <p className="text-base-content/70">
                • This is a testing tool for administrators to verify notification delivery.
              </p>
              <p className="text-base-content/70">
                • Email notifications will be sent from the configured email service.
              </p>
              <p className="text-base-content/70">
                • SMS notifications require a valid phone number with country code.
              </p>
              <p className="text-base-content/70">
                • Push notifications require a valid user ID with an active session.
              </p>
              <p className="text-base-content/70">
                • All test notifications are logged but marked as test messages.
              </p>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-8">
            <div className="divider">Test Results</div>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(result => (
                    <tr key={result.id}>
                      <td>{new Date(result.timestamp).toLocaleTimeString()}</td>
                      <td>{testTypes[result.type]?.label || result.type}</td>
                      <td>{result.email}</td>
                      <td>
                        <span className={`badge ${result.success ? 'badge-success' : 'badge-error'}`}>
                          {result.success ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                      <td>{result.duration}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}