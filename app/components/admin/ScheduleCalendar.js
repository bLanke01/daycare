// components/admin/ScheduleCalendar.js
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ScheduleCalendar = () => {
  // State for current date and events
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('date', '>=', Timestamp.fromDate(startOfMonth)),
          where('date', '<=', Timestamp.fromDate(endOfMonth))
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedEvents = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedEvents.push({
            id: doc.id,
            ...data,
            date: data.date.toDate() // Convert Timestamp to Date
          });
        });
        
        setEvents(fetchedEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentMonth, currentYear]);
  
  // State for new event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    group: '',
    time: '',
    description: ''
  });
  
  // State for event details modal
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push({ day: null, events: [] });
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayEvents = events.filter(event => {
        const eventDate = event.date;
        return eventDate.getDate() === day &&
               eventDate.getMonth() === currentMonth &&
               eventDate.getFullYear() === currentYear;
      });
      
      calendarDays.push({ day, date, events: dayEvents });
    }
    
    return calendarDays;
  };
  
  // Calendar navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Handle opening the event form when clicking on a date
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setNewEvent({
      ...newEvent,
      date: date.toISOString().split('T')[0]
    });
    setShowEventForm(true);
  };
  
  // Handle viewing event details
  const handleEventClick = (event, e) => {
    e.stopPropagation(); // Prevent triggering the date click
    setSelectedEvent(event);
    setShowEventDetails(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dateObj = new Date(newEvent.date);
      const eventData = {
        title: newEvent.title,
        date: Timestamp.fromDate(dateObj),
        group: newEvent.group,
        time: newEvent.time,
        description: newEvent.description,
        createdAt: Timestamp.now()
      };
      
      if (newEvent.id) {
        // Update existing event
        const eventRef = doc(db, 'events', newEvent.id);
        await updateDoc(eventRef, eventData);
        
        setEvents(events.map(event => 
          event.id === newEvent.id 
            ? { ...eventData, id: newEvent.id, date: dateObj } 
            : event
        ));
      } else {
        // Add new event
        const docRef = await addDoc(collection(db, 'events'), eventData);
        setEvents([...events, { ...eventData, id: docRef.id, date: dateObj }]);
      }
      
      setShowEventForm(false);
      setNewEvent({
        title: '',
        date: '',
        group: '',
        time: '',
        description: ''
      });
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    }
  };
  
  // Handle event deletion
  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      setEvents(events.filter(event => event.id !== eventId));
      setShowEventDetails(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    }
  };
  
  // Format month and year for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const calendarDays = generateCalendarDays();
  
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }
  
  return (
    <div className="schedule-calendar">
      <div className="page-header">
        <h1>Schedule & Calendar</h1>
        <button 
          className="add-event-btn"
          onClick={() => {
            setSelectedDate(new Date());
            setNewEvent({
              ...newEvent,
              date: new Date().toISOString().split('T')[0]
            });
            setShowEventForm(true);
          }}
        >
          Add New Event
        </button>
      </div>
      
      <div className="calendar-container">
        <div className="calendar-navigation">
          <button className="nav-btn" onClick={goToPreviousMonth}>
            &lt; Previous
          </button>
          <h2 className="current-month">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button className="nav-btn" onClick={goToNextMonth}>
            Next &gt;
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-header">
            <div className="weekday">Sunday</div>
            <div className="weekday">Monday</div>
            <div className="weekday">Tuesday</div>
            <div className="weekday">Wednesday</div>
            <div className="weekday">Thursday</div>
            <div className="weekday">Friday</div>
            <div className="weekday">Saturday</div>
          </div>

          <div className="calendar-days">
            {calendarDays.map((calendarDay, index) => (
              <div 
                key={index} 
                className={`calendar-day ${!calendarDay.day ? 'empty' : ''} ${
                  calendarDay.day === today.getDate() && 
                  currentMonth === today.getMonth() && 
                  currentYear === today.getFullYear() ? 'today' : ''
                }`}
                onClick={() => calendarDay.day && handleDateClick(calendarDay.date)}
              >
                {calendarDay.day && (
                  <>
                    <div className="day-number">{calendarDay.day}</div>
                    <div className="day-events">
                      {calendarDay.events.map(event => (
                        <div 
                          key={event.id} 
                          className="event"
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          <div className="event-title">{event.title}</div>
                          <div className="event-time">{event.time}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{newEvent.id ? 'Edit Event' : 'Add New Event'}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEventForm(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Event Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={newEvent.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="group">Group</label>
                <select
                  id="group"
                  name="group"
                  value={newEvent.group}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a group</option>
                  <option value="All">All Groups</option>
                  <option value="Infant">Infant</option>
                  <option value="Toddler">Toddler</option>
                  <option value="Pre-K">Pre-K</option>
                  <option value="Infant, Toddler">Infant & Toddler</option>
                  <option value="Toddler, Pre-K">Toddler & Pre-K</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input
                  type="text"
                  id="time"
                  name="time"
                  value={newEvent.time}
                  onChange={handleInputChange}
                  placeholder="e.g. 9:00 AM - 11:00 AM"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {newEvent.id ? 'Save Changes' : 'Add Event'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEventForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Event Details</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEventDetails(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-content">
              <h3>{selectedEvent.title}</h3>
              
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {selectedEvent.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{selectedEvent.time}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Group:</span>
                <span className="detail-value">{selectedEvent.group}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <p className="detail-value">{selectedEvent.description}</p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="edit-btn"
                onClick={() => {
                  setNewEvent({
                    ...selectedEvent,
                    date: selectedEvent.date.toISOString().split('T')[0]
                  });
                  setShowEventDetails(false);
                  setShowEventForm(true);
                }}
              >
                Edit Event
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteEvent(selectedEvent.id)}
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;