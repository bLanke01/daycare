'use client';

import { useState } from 'react';

export default function Help({ userType }) {
  const [activeSection, setActiveSection] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = {
    admin: [
      {
        question: 'How do I add a new event to the calendar?',
        answer: 'To add a new event, go to the Schedule page and click the "Add New Event" button. Fill in the event details in the form that appears and click "Add Event" to save.'
      },
      {
        question: 'How do I approve parent registration requests?',
        answer: 'Parent registration requests can be found in the Dashboard under "Pending Requests". Click "Approve" or "Deny" next to each request to process them.'
      },
      {
        question: 'How do I manage staff accounts?',
        answer: 'Staff accounts can be managed in the Staff Management section. You can add new staff members, edit their information, and set their access permissions.'
      }
    ],
    parent: [
      {
        question: 'How do I view my child\'s schedule?',
        answer: 'You can view your child\'s schedule in the Calendar section. Events and activities specific to your child\'s group will be displayed there.'
      },
      {
        question: 'How do I update my contact information?',
        answer: 'Go to Account Settings and click "Edit Profile" to update your contact information. Don\'t forget to click "Save Changes" when done.'
      },
      {
        question: 'How do I communicate with staff?',
        answer: 'You can send messages to staff through the Messages section. Select the staff member you want to contact and write your message.'
      }
    ]
  };

  const supportResources = {
    admin: [
      {
        title: 'Admin User Guide',
        description: 'Comprehensive guide for managing the daycare system',
        link: '/docs/admin-guide.pdf'
      },
      {
        title: 'Staff Training Materials',
        description: 'Resources for training new staff members',
        link: '/docs/staff-training.pdf'
      }
    ],
    parent: [
      {
        title: 'Parent Handbook',
        description: 'Essential information for parents',
        link: '/docs/parent-handbook.pdf'
      },
      {
        title: 'Emergency Procedures',
        description: 'Important safety information',
        link: '/docs/emergency-procedures.pdf'
      }
    ]
  };

  const filteredFaqs = faqs[userType].filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="help-container">
      <h1>Help Center</h1>

      <div className="help-navigation">
        <button
          className={`nav-btn ${activeSection === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveSection('faq')}
        >
          FAQs
        </button>
        <button
          className={`nav-btn ${activeSection === 'support' ? 'active' : ''}`}
          onClick={() => setActiveSection('support')}
        >
          Support Resources
        </button>
        <button
          className={`nav-btn ${activeSection === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveSection('contact')}
        >
          Contact Support
        </button>
      </div>

      {activeSection === 'faq' && (
        <section className="faq-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="faq-list">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p className="no-results">No matching FAQs found.</p>
            )}
          </div>
        </section>
      )}

      {activeSection === 'support' && (
        <section className="support-section">
          <h2>Support Resources</h2>
          <div className="resources-list">
            {supportResources[userType].map((resource, index) => (
              <div key={index} className="resource-item">
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <a href={resource.link} target="_blank" rel="noopener noreferrer">
                  View Resource
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'contact' && (
        <section className="contact-section">
          <h2>Contact Support</h2>
          <form className="contact-form">
            <div className="form-group">
              <label>Subject</label>
              <input type="text" required />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea rows="5" required></textarea>
            </div>

            <button type="submit">Send Message</button>
          </form>

          <div className="contact-info">
            <h3>Other Ways to Reach Us</h3>
            <p>Email: support@daycare.com</p>
            <p>Phone: (555) 123-4567</p>
            <p>Hours: Monday - Friday, 9:00 AM - 5:00 PM</p>
          </div>
        </section>
      )}
    </div>
  );
} 