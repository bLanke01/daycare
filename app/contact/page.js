'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
  // Get current date for the calendar
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // State for form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
    phone: ''
  });
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Process form data (would connect to backend in a real implementation)
  };
  
  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    return calendarDays;
  };
  
  const calendarDays = generateCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return (
    <div className="contact-page">
      <div className="content-wrapper">
        <div className="contact-form-container">
          <h1>Book a tour with your kids</h1>
          <p>We're happy to show you around our center and answer your questions.</p>
          
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select a subject</option>
                <option value="tour">Facility Tour</option>
                <option value="enrollment">Enrollment Information</option>
                <option value="program">Program Details</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Enter Your Message</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-container">
                <span className="country-code">+1</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <button type="submit" className="cta-button">Submit form</button>
          </form>
        </div>
        
        <div className="calendar-container">
          <div className="calendar-header">
            <h2>{monthNames[currentMonth]} {currentYear}</h2>
          </div>
          
          <div className="calendar-weekdays">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>
          
          <div className="calendar">
            {calendarDays.map((day, index) => (
              <div 
                key={index} 
                className={`calendar-day ${!day ? 'empty' : ''} ${day === today.getDate() ? 'today' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}