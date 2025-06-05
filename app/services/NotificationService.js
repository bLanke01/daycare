// app/services/notificationService.js - Fixed version without undefined variables
'use client';

import { collection, addDoc, getDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sendEmail as sendEmailUtil } from '../utils/emailService';

class NotificationService {
  constructor() {
    this.emailTemplates = this.initializeEmailTemplates();
  }

  // Initialize email templates to avoid any undefined variable issues
  initializeEmailTemplates() {
    return {
      // Admin notifications
      NEW_CALENDAR_EVENT: {
        subject: '📅 New Calendar Event Created - PLACEHOLDER_TITLE',
        template: this.createAdminEventTemplate()
      },

      // Parent notifications
      NEW_CALENDAR_EVENT_PARENT: {
        subject: '📅 New Event: PLACEHOLDER_TITLE - PLACEHOLDER_CHILD',
        template: this.createParentEventTemplate()
      },

      NEW_INVOICE: {
        subject: '💰 New Invoice #PLACEHOLDER_INVOICE - PLACEHOLDER_CHILD',
        template: this.createInvoiceTemplate()
      },

      INVOICE_PAID: {
        subject: '✅ Payment Confirmed - Invoice #PLACEHOLDER_INVOICE',
        template: this.createPaymentTemplate()
      }
    };
  }

  createAdminEventTemplate() {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        📅 New Calendar Event Created
      </h2>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4CAF50;">PLACEHOLDER_TITLE</h3>
        <p><strong>📅 Date:</strong> PLACEHOLDER_DATE</p>
        <p><strong>🕐 Time:</strong> PLACEHOLDER_TIME</p>
        <p><strong>👥 Group:</strong> PLACEHOLDER_GROUP</p>
        <p><strong>📝 Description:</strong> PLACEHOLDER_DESCRIPTION</p>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #1976d2;">📧 Notification sent to:</h4>
        <p>✅ All parents in affected groups will be automatically notified about this event.</p>
      </div>
      
      <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #f57c00;">💡 Other notifications you might want to consider:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Send reminder notifications 24 hours before the event</li>
          <li>Create attendance tracking for this event</li>
          <li>Notify staff members about special preparation needs</li>
          <li>Add this event to the daycare website calendar</li>
          <li>Send follow-up notifications with photos/updates after the event</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="PLACEHOLDER_DASHBOARD" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          📊 View Admin Dashboard
        </a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        This notification was sent because you have calendar event notifications enabled in your admin settings.
        <br>You can modify your notification preferences in the Admin Settings panel.
      </p>
    </div>
    `;
  }

  createParentEventTemplate() {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 10px;">
        📅 New Event for PLACEHOLDER_CHILD
      </h2>
      
      <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #7B1FA2;">PLACEHOLDER_TITLE</h3>
        <p><strong>📅 Date:</strong> PLACEHOLDER_DATE</p>
        <p><strong>🕐 Time:</strong> PLACEHOLDER_TIME</p>
        <p><strong>👥 Group:</strong> PLACEHOLDER_GROUP</p>
        <p><strong>📝 Description:</strong> PLACEHOLDER_DESCRIPTION</p>
      </div>
      
      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4CAF50;">✅ What you need to know:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Mark your calendar for this special event</li>
          <li>No action required unless specified in the description</li>
          <li>Check with daycare staff if you have any questions</li>
          <li>Photos and updates may be shared after the event</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="PLACEHOLDER_DASHBOARD" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          👶 View PLACEHOLDER_CHILD's Dashboard
        </a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        This notification was sent because you have calendar event notifications enabled.
        <br>You can modify your notification preferences in your Parent Settings.
      </p>
    </div>
    `;
  }

  createInvoiceTemplate() {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #FF9800; padding-bottom: 10px;">
        💰 New Invoice Received
      </h2>
      
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #F57C00;">Invoice #PLACEHOLDER_INVOICE</h3>
        <p><strong>👶 Child:</strong> PLACEHOLDER_CHILD</p>
        <p><strong>💰 Amount:</strong> $PLACEHOLDER_AMOUNT</p>
        <p><strong>📅 Due Date:</strong> PLACEHOLDER_DUE</p>
        <p><strong>📊 Status:</strong> <span style="background: #ffeb3b; padding: 4px 8px; border-radius: 4px; color: #333;">PLACEHOLDER_STATUS</span></p>
      </div>
      
      <div style="background: #e1f5fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #0288d1;">💳 Payment Instructions:</h4>
        <p><strong>E-transfer Email:</strong> PLACEHOLDER_EMAIL</p>
        <p><strong>Reference:</strong> Invoice #PLACEHOLDER_INVOICE</p>
        <p><strong>Steps to pay:</strong></p>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Send e-transfer to the email above</li>
          <li>Include the invoice number as reference</li>
          <li>Email us after sending payment for faster processing</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="PLACEHOLDER_INVOICE_URL" style="background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
          📄 View Full Invoice
        </a>
        <a href="PLACEHOLDER_DASHBOARD" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          💬 Message Daycare
        </a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        This notification was sent because you have invoice notifications enabled.
        <br>You can modify your notification preferences in your Parent Settings.
      </p>
    </div>
    `;
  }

  createPaymentTemplate() {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        ✅ Payment Confirmed!
      </h2>
      
      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h3 style="margin: 0; color: #4CAF50;">Thank you for your payment!</h3>
        <p style="margin: 10px 0 0 0; color: #666;">Your payment has been received and processed.</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #333;">Payment Details:</h4>
        <p><strong>📄 Invoice #:</strong> PLACEHOLDER_INVOICE</p>
        <p><strong>👶 Child:</strong> PLACEHOLDER_CHILD</p>
        <p><strong>💰 Amount Paid:</strong> $PLACEHOLDER_AMOUNT</p>
        <p><strong>📅 Payment Date:</strong> PLACEHOLDER_DATE</p>
        <p><strong>📊 Status:</strong> <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px;">PAID</span></p>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #1976d2;">📋 What happens next:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Your account is up to date</li>
          <li>Receipt is available in your parent dashboard</li>
          <li>Future invoices will be sent as scheduled</li>
          <li>Contact us if you have any questions</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="PLACEHOLDER_INVOICE_URL" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
          📄 View Receipt
        </a>
        <a href="PLACEHOLDER_DASHBOARD" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          👶 View Dashboard
        </a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        This notification was sent because you have payment confirmation notifications enabled.
        <br>You can modify your notification preferences in your Parent Settings.
      </p>
    </div>
    `;
  }

  // Replace template placeholders with actual values
  processTemplate(template, variables) {
    let processed = template;
    
    // Define the mapping of placeholder names to variables
    const placeholderMap = {
      'PLACEHOLDER_TITLE': variables.eventTitle || variables.title || 'Event',
      'PLACEHOLDER_DATE': variables.eventDate || variables.date || 'Not specified',
      'PLACEHOLDER_TIME': variables.eventTime || variables.time || 'Not specified',
      'PLACEHOLDER_GROUP': variables.eventGroup || variables.group || 'All',
      'PLACEHOLDER_DESCRIPTION': variables.eventDescription || variables.description || 'No description',
      'PLACEHOLDER_CHILD': variables.childName || 'Your Child',
      'PLACEHOLDER_INVOICE': variables.invoiceNumber || variables.invoiceNo || 'N/A',
      'PLACEHOLDER_AMOUNT': variables.totalAmount || '0.00',
      'PLACEHOLDER_DUE': variables.dueDate || 'Not specified',
      'PLACEHOLDER_STATUS': variables.status || 'PENDING',
      'PLACEHOLDER_EMAIL': variables.paymentEmail || 'payments@daycare.com',
      'PLACEHOLDER_INVOICE_URL': variables.invoiceUrl || '#',
      'PLACEHOLDER_DASHBOARD': variables.dashboardUrl || '#'
    };

    // Replace all placeholders
    for (const [placeholder, value] of Object.entries(placeholderMap)) {
      const regex = new RegExp(placeholder, 'g');
      const safeValue = value !== null && value !== undefined ? String(value) : '';
      processed = processed.replace(regex, safeValue);
    }
    
    return processed;
  }

  // Check if user has notifications enabled
  async checkNotificationSettings(userId, notificationType) {
    try {
      const settingsDoc = await getDoc(doc(db, 'notificationSettings', userId));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        return settings.emailNotifications && settings[notificationType];
      }
      return true; // Default to enabled if no settings found
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return false;
    }
  }

  // Send email notification using nodemailer
  async sendEmail(to, subject, htmlContent, metadata = {}) {
    try {
      console.log('📧 SENDING EMAIL:', {
        to,
        subject,
        preview: htmlContent.substring(0, 100) + '...',
        metadata
      });

      // Send email using our email service
      const result = await sendEmailUtil(to, subject, htmlContent);

      if (result.success) {
        // Store notification in Firestore for tracking
        await addDoc(collection(db, 'emailNotifications'), {
          to,
          subject,
          htmlContent,
          metadata,
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date().toISOString(),
          type: metadata.type || 'general'
        });

        console.log('✅ Email sent successfully to:', to);
        return { success: true, messageId: result.messageId };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      
      // Store failed notification attempt
      await addDoc(collection(db, 'emailNotifications'), {
        to,
        subject,
        htmlContent,
        metadata,
        status: 'failed',
        error: error.message,
        sentAt: new Date().toISOString(),
        type: metadata.type || 'general'
      });
      
      return { success: false, error: error.message };
    }
  }

  // Notify admins about new calendar events
  async notifyAdminsNewEvent(eventData) {
    try {
      console.log('🔔 Notifying admins about new calendar event...');

      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      const adminsSnapshot = await getDocs(adminsQuery);

      for (const adminDoc of adminsSnapshot.docs) {
        const adminData = adminDoc.data();
        
        const hasNotifications = await this.checkNotificationSettings(
          adminData.uid, 
          'notifyOnEvents'
        );

        if (hasNotifications) {
          const emailTemplate = this.emailTemplates.NEW_CALENDAR_EVENT;
          const subject = this.processTemplate(emailTemplate.subject, {
            eventTitle: eventData.title
          });

          const htmlContent = this.processTemplate(emailTemplate.template, {
            eventTitle: eventData.title,
            eventDate: new Date(eventData.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            eventTime: eventData.time,
            eventGroup: eventData.group,
            eventDescription: eventData.description,
            dashboardUrl: `${window.location.origin}/admin`
          });

          await this.sendEmail(
            adminData.email,
            subject,
            htmlContent,
            {
              type: 'admin_new_event',
              eventId: eventData.id,
              adminId: adminData.uid
            }
          );
        }
      }

      console.log('✅ Admin notifications sent');
    } catch (error) {
      console.error('❌ Error notifying admins:', error);
    }
  }

  // Notify parents about new calendar events
  async notifyParentsNewEvent(eventData) {
    try {
      console.log('🔔 Notifying parents about new calendar event...');

      let parentsQuery;
      
      if (eventData.group === 'All' || eventData.group === 'All Groups') {
        parentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'parent')
        );
      } else {
        const groupNames = eventData.group.split(',').map(g => g.trim());
        const childrenQuery = query(
          collection(db, 'children'),
          where('group', 'in', groupNames)
        );
        const childrenSnapshot = await getDocs(childrenQuery);
        
        const parentIds = [...new Set(
          childrenSnapshot.docs
            .map(doc => doc.data().parentId)
            .filter(id => id)
        )];

        if (parentIds.length === 0) {
          console.log('No parents found for groups:', groupNames);
          return;
        }

        const batches = [];
        for (let i = 0; i < parentIds.length; i += 10) {
          const batch = parentIds.slice(i, i + 10);
          batches.push(
            getDocs(query(
              collection(db, 'users'),
              where('uid', 'in', batch)
            ))
          );
        }

        const parentsSnapshots = await Promise.all(batches);
        const parentDocs = parentsSnapshots.flatMap(snapshot => snapshot.docs);

        for (const parentDoc of parentDocs) {
          await this.sendParentEventNotification(parentDoc.data(), eventData);
        }
        return;
      }

      const parentsSnapshot = await getDocs(parentsQuery);
      for (const parentDoc of parentsSnapshot.docs) {
        await this.sendParentEventNotification(parentDoc.data(), eventData);
      }

      console.log('✅ Parent notifications sent');
    } catch (error) {
      console.error('❌ Error notifying parents:', error);
    }
  }

  // Helper method to send individual parent notifications
  async sendParentEventNotification(parentData, eventData) {
    try {
      const hasNotifications = await this.checkNotificationSettings(
        parentData.uid, 
        'notifyOnEvents'
      );

      if (!hasNotifications) {
        return;
      }

      const childrenQuery = query(
        collection(db, 'children'),
        where('parentId', '==', parentData.uid)
      );
      const childrenSnapshot = await getDocs(childrenQuery);
      const childName = childrenSnapshot.empty ? 
        'Your Child' : 
        `${childrenSnapshot.docs[0].data().firstName} ${childrenSnapshot.docs[0].data().lastName}`;

      const emailTemplate = this.emailTemplates.NEW_CALENDAR_EVENT_PARENT;
      const subject = this.processTemplate(emailTemplate.subject, {
        eventTitle: eventData.title,
        childName: childName
      });

      const htmlContent = this.processTemplate(emailTemplate.template, {
        eventTitle: eventData.title,
        childName: childName,
        eventDate: new Date(eventData.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        eventTime: eventData.time,
        eventGroup: eventData.group,
        eventDescription: eventData.description,
        dashboardUrl: `${window.location.origin}/parent`
      });

      await this.sendEmail(
        parentData.email,
        subject,
        htmlContent,
        {
          type: 'parent_new_event',
          eventId: eventData.id,
          parentId: parentData.uid,
          childName: childName
        }
      );
    } catch (error) {
      console.error('❌ Error sending parent notification:', error);
    }
  }

  // Notify parent about new invoice
  async notifyParentNewInvoice(invoiceData, parentData) {
    try {
      console.log('🔔 Notifying parent about new invoice...');

      const hasNotifications = await this.checkNotificationSettings(
        parentData.uid, 
        'notifyOnInvoices'
      );

      if (!hasNotifications) {
        console.log('Parent has invoice notifications disabled');
        return;
      }

      const totalAmount = invoiceData.totalAmount || invoiceData.subTotal || 0;
      const invoiceNumber = invoiceData.invoiceNo || invoiceData.invoiceNumber || 'N/A';
      const childName = invoiceData.parentName || invoiceData.childName || 'Your Child';
      const dueDate = invoiceData.dueDate || new Date();
      const status = invoiceData.status || 'pending';

      const emailTemplate = this.emailTemplates.NEW_INVOICE;
      const subject = this.processTemplate(emailTemplate.subject, {
        invoiceNumber: invoiceNumber,
        childName: childName
      });

      const htmlContent = this.processTemplate(emailTemplate.template, {
        invoiceNumber: invoiceNumber,
        childName: childName,
        totalAmount: typeof totalAmount === 'number' ? totalAmount.toFixed(2) : '0.00',
        dueDate: new Date(dueDate).toLocaleDateString(),
        status: status.toUpperCase(),
        paymentEmail: invoiceData.paymentEmail || 'payments@daycare.com',
        invoiceUrl: `${window.location.origin}/parent/invoices`,
        dashboardUrl: `${window.location.origin}/parent/messages`
      });

      await this.sendEmail(
        parentData.email,
        subject,
        htmlContent,
        {
          type: 'new_invoice',
          invoiceId: invoiceData.id,
          parentId: parentData.uid,
          amount: totalAmount
        }
      );

      console.log('✅ Invoice notification sent to parent');
    } catch (error) {
      console.error('❌ Error notifying parent about invoice:', error);
    }
  }

  // Notify parent about paid invoice
  async notifyParentInvoicePaid(invoiceData, parentData) {
    try {
      console.log('🔔 Notifying parent about paid invoice...');

      const hasNotifications = await this.checkNotificationSettings(
        parentData.uid, 
        'notifyOnPayments'
      );

      if (!hasNotifications) {
        console.log('Parent has payment notifications disabled');
        return;
      }

      const totalAmount = invoiceData.totalAmount || invoiceData.subTotal || 0;
      const invoiceNumber = invoiceData.invoiceNo || invoiceData.invoiceNumber || 'N/A';
      const childName = invoiceData.parentName || invoiceData.childName || 'Your Child';
      const paidDate = invoiceData.paidAt || new Date();

      const emailTemplate = this.emailTemplates.INVOICE_PAID;
      const subject = this.processTemplate(emailTemplate.subject, {
        invoiceNumber: invoiceNumber
      });

      const htmlContent = this.processTemplate(emailTemplate.template, {
        invoiceNumber: invoiceNumber,
        childName: childName,
        totalAmount: typeof totalAmount === 'number' ? totalAmount.toFixed(2) : '0.00',
        paidDate: new Date(paidDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        invoiceUrl: `${window.location.origin}/parent/invoices`,
        dashboardUrl: `${window.location.origin}/parent`
      });

      await this.sendEmail(
        parentData.email,
        subject,
        htmlContent,
        {
          type: 'invoice_paid',
          invoiceId: invoiceData.id,
          parentId: parentData.uid,
          amount: totalAmount
        }
      );

      console.log('✅ Payment confirmation notification sent to parent');
    } catch (error) {
      console.error('❌ Error notifying parent about payment:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;