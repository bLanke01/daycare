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
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h1 className="card-title text-3xl mb-6">Help Center</h1>

        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab ${activeSection === 'faq' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('faq')}
          >
            FAQs
          </button>
          <button
            className={`tab ${activeSection === 'support' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('support')}
          >
            Support Resources
          </button>
          <button
            className={`tab ${activeSection === 'contact' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('contact')}
          >
            Contact Support
          </button>
        </div>

        {activeSection === 'faq' && (
          <section>
            <div className="form-control mb-6">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  className="input input-bordered w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-square">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="collapse collapse-plus bg-base-200">
                  <input type="radio" name="faq-accordion" /> 
                  <div className="collapse-title text-xl font-medium">
                    {faq.question}
                  </div>
                  <div className="collapse-content">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No matching FAQs found.</span>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === 'support' && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Support Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportResources[userType].map((resource, index) => (
                <div key={index} className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">{resource.title}</h3>
                    <p>{resource.description}</p>
                    <div className="card-actions justify-end">
                      <a 
                        href={resource.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        View Resource
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'contact' && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Contact Support</h2>
            <form className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Subject</span>
                </label>
                <input type="text" className="input input-bordered w-full" required />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Message</span>
                </label>
                <textarea className="textarea textarea-bordered h-32" required></textarea>
              </div>

              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>

            <div className="divider"></div>

            <div className="bg-base-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-bold mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>support@daycare.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Monday - Friday, 9:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
} 