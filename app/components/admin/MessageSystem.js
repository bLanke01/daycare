// components/admin/MessageSystem.js
'use client';

import { useState } from 'react';

const MessageSystem = () => {
  // Mock data for messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Sarah Thompson',
      role: 'Parent',
      subject: 'Vacation Notice',
      content: 'Hello, I wanted to inform you that Emma will be absent next week as we are going on a family vacation. We will return on the 15th.',
      date: '2025-05-03T09:45:00Z',
      read: true,
      attachments: []
    },
    {
      id: 2,
      sender: 'Admin',
      role: 'Admin',
      subject: 'Re: Vacation Notice',
      content: 'Thank you for letting us know, Sarah. We hope you have a wonderful vacation! Emma\'s spot will be held for her return.',
      date: '2025-05-03T10:15:00Z',
      read: true,
      attachments: []
    },
    {
      id: 3,
      sender: 'Maria Garcia',
      role: 'Parent',
      subject: 'Allergy Concern',
      content: 'Hi, I noticed that Noah had a small rash yesterday when I picked him up. I\'m concerned it might be an allergic reaction to something he ate. Could you please check the lunch menu for yesterday?',
      date: '2025-05-04T14:30:00Z',
      read: false,
      attachments: [
        { name: 'rash_photo.jpg', size: '1.2MB' }
      ]
    },
    {
      id: 4,
      sender: 'James Johnson',
      role: 'Parent',
      subject: 'Payment Question',
      content: 'Hello, I have a question about my recent invoice. It seems to include a $25 fee that wasn\'t on previous invoices. Could you explain what this charge is for?',
      date: '2025-05-05T11:20:00Z',
      read: false,
      attachments: [
        { name: 'invoice_may.pdf', size: '245KB' }
      ]
    },
    {
      id: 5,
      sender: 'Admin',
      role: 'Admin',
      subject: 'Summer Program Announcement',
      content: 'Dear Parents, We\'re excited to announce our summer program activities! Registration is now open through our parent portal. Please register by May 20th to secure your child\'s spot. Activities include water play, nature exploration, and special weekly themes.',
      date: '2025-05-02T08:00:00Z',
      read: true,
      attachments: [
        { name: 'summer_program.pdf', size: '1.5MB' }
      ]
    }
  ]);
  
  // State for selected message and compose form
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient: '',
    subject: '',
    content: '',
    attachments: []
  });
  const [replyData, setReplyData] = useState({
    content: '',
    attachments: []
  });
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'sent'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter messages
  const filteredMessages = messages.filter(message => {
    let matchesFilter = true;
    if (filter === 'unread') {
      matchesFilter = !message.read;
    } else if (filter === 'sent') {
      matchesFilter = message.sender === 'Admin';
    }
    
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          message.sender.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  // Group messages by conversation (using subject as a simple way to group)
  const groupedMessages = {};
  filteredMessages.forEach(message => {
    // Remove "Re: " from subject for grouping purposes
    const baseSubject = message.subject.replace(/^Re:\s*/i, '');
    
    if (!groupedMessages[baseSubject]) {
      groupedMessages[baseSubject] = [];
    }
    
    groupedMessages[baseSubject].push(message);
  });
  
  // Sort conversations by the date of their most recent message
  const sortedConversations = Object.entries(groupedMessages).sort((a, b) => {
    const aLatestDate = new Date(Math.max(...a[1].map(msg => new Date(msg.date))));
    const bLatestDate = new Date(Math.max(...b[1].map(msg => new Date(msg.date))));
    return bLatestDate - aLatestDate;
  });
  
  // Handle message selection
  const handleMessageSelect = (message) => {
    setSelectedMessage(message);
    
    // Mark as read if unread
    if (!message.read) {
      const updatedMessages = messages.map(msg => {
        if (msg.id === message.id) {
          return { ...msg, read: true };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
    }
    
    // Initialize reply form
    setReplyData({
      content: '',
      attachments: []
    });
  };
  
  // Handle compose form changes
  const handleComposeChange = (e) => {
    const { name, value } = e.target;
    setComposeData({
      ...composeData,
      [name]: value
    });
  };
  
  // Handle reply form changes
  const handleReplyChange = (e) => {
    const { name, value } = e.target;
    setReplyData({
      ...replyData,
      [name]: value
    });
  };
  
  // Handle file upload for compose form
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileDetails = files.map(file => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`
    }));
    
    setComposeData({
      ...composeData,
      attachments: [...composeData.attachments, ...fileDetails]
    });
  };
  
  // Handle file upload for reply form
  const handleReplyFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileDetails = files.map(file => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`
    }));
    
    setReplyData({
      ...replyData,
      attachments: [...replyData.attachments, ...fileDetails]
    });
  };
  
  // Handle compose form submission
  const handleComposeSend = (e) => {
    e.preventDefault();
    
    const newMessage = {
      id: messages.length + 1,
      sender: 'Admin',
      role: 'Admin',
      subject: composeData.subject,
      content: composeData.content,
      date: new Date().toISOString(),
      read: true,
      attachments: composeData.attachments
    };
    
    setMessages([...messages, newMessage]);
    setShowComposeForm(false);
    setComposeData({
      recipient: '',
      subject: '',
      content: '',
      attachments: []
    });
  };
  
  // Handle reply submission
  const handleReplySend = (e) => {
    e.preventDefault();
    
    if (!selectedMessage) return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: 'Admin',
      role: 'Admin',
      subject: selectedMessage.subject.startsWith('Re:') 
        ? selectedMessage.subject 
        : `Re: ${selectedMessage.subject}`,
      content: replyData.content,
      date: new Date().toISOString(),
      read: true,
      attachments: replyData.attachments
    };
    
    setMessages([...messages, newMessage]);
    setReplyData({
      content: '',
      attachments: []
    });
    
    // Update the selected message to include the reply
    setSelectedMessage(newMessage);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  
  return (
    <div className="message-system">
      <div className="page-header">
        <h1>Message System</h1>
        <button 
          className="compose-btn"
          onClick={() => setShowComposeForm(true)}
        >
          Compose New Message
        </button>
      </div>
      
      <div className="message-container">
        <div className="message-sidebar">
          <div className="message-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Messages
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
            <button 
              className={`filter-btn ${filter === 'sent' ? 'active' : ''}`}
              onClick={() => setFilter('sent')}
            >
              Sent
            </button>
          </div>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="message-list">
            {sortedConversations.map(([subject, conversation]) => {
              const latestMessage = conversation.reduce((latest, current) => {
                return new Date(current.date) > new Date(latest.date) ? current : latest;
              });
              
              const hasUnread = conversation.some(msg => !msg.read);
              
              return (
                <div 
                  key={subject}
                  className={`message-item ${hasUnread ? 'unread' : ''} ${selectedMessage && latestMessage.id === selectedMessage.id ? 'active' : ''}`}
                  onClick={() => handleMessageSelect(latestMessage)}
                >
                  <div className="message-sender">
                    <span className="sender-name">{latestMessage.sender}</span>
                    <span className="message-date">{formatDate(latestMessage.date)}</span>
                  </div>
                  <div className="message-subject">{latestMessage.subject}</div>
                  <div className="message-preview">
                    {latestMessage.content.substring(0, 60)}
                    {latestMessage.content.length > 60 ? '...' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="message-content">
          {selectedMessage ? (
            <div className="selected-message">
              <div className="message-header">
                <h2>{selectedMessage.subject}</h2>
                <div className="message-meta">
                  <div className="sender-info">
                    <span className="sender-name">From: {selectedMessage.sender}</span>
                    <span className="sender-role">({selectedMessage.role})</span>
                  </div>
                  <div className="message-date">
                    {new Date(selectedMessage.date).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="message-body">
                <p>{selectedMessage.content}</p>
              </div>
              
              {selectedMessage.attachments.length > 0 && (
                <div className="message-attachments">
                  <h3>Attachments</h3>
                  <div className="attachment-list">
                    {selectedMessage.attachments.map((attachment, index) => (
                      <div key={index} className="attachment-item">
                        <span className="attachment-icon">📎</span>
                        <span className="attachment-name">{attachment.name}</span>
                        <span className="attachment-size">({attachment.size})</span>
                        <button className="download-btn">Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="reply-form">
                <h3>Reply</h3>
                <form onSubmit={handleReplySend}>
                  <div className="form-group">
                    <textarea
                      name="content"
                      value={replyData.content}
                      onChange={handleReplyChange}
                      placeholder="Type your reply here..."
                      rows="5"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="replyAttachments">Attachments</label>
                    <input
                      type="file"
                      id="replyAttachments"
                      multiple
                      onChange={handleReplyFileUpload}
                    />
                  </div>
                  
                  {replyData.attachments.length > 0 && (
                    <div className="selected-attachments">
                      <h4>Selected Files:</h4>
                      <ul>
                        {replyData.attachments.map((file, index) => (
                          <li key={index}>
                            {file.name} ({file.size})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="form-actions">
                    <button type="submit" className="send-btn">Send Reply</button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="no-message-selected">
              <p>Select a message to view its contents</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Compose Message Modal */}
      {showComposeForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Compose New Message</h2>
              <button 
                className="close-btn"
                onClick={() => setShowComposeForm(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleComposeSend}>
              <div className="form-group">
                <label htmlFor="recipient">To</label>
                <select
                  id="recipient"
                  name="recipient"
                  value={composeData.recipient}
                  onChange={handleComposeChange}
                  required
                >
                  <option value="">Select Recipient</option>
                  <option value="all">All Parents</option>
                  <option value="Sarah Thompson">Sarah Thompson</option>
                  <option value="Maria Garcia">Maria Garcia</option>
                  <option value="Juan Martinez">Juan Martinez</option>
                  <option value="James Johnson">James Johnson</option>
                  <option value="Emily Wilson">Emily Wilson</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={composeData.subject}
                  onChange={handleComposeChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="content">Message</label>
                <textarea
                  id="content"
                  name="content"
                  value={composeData.content}
                  onChange={handleComposeChange}
                  rows="8"
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="attachments">Attachments</label>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={handleFileUpload}
                />
              </div>
              
              {composeData.attachments.length > 0 && (
                <div className="selected-attachments">
                  <h4>Selected Files:</h4>
                  <ul>
                    {composeData.attachments.map((file, index) => (
                      <li key={index}>
                        {file.name} ({file.size})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="form-actions">
                <button type="submit" className="send-btn">Send Message</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowComposeForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSystem;