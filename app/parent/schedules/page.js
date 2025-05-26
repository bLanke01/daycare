'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function ParentSchedules() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = generateCalendarDays();

  return (
    <div className="parent-schedules-page">
      <div className="page-header">
        <h1>Daycare Schedule</h1>
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
                  calendarDay.day === new Date().getDate() && 
                  currentMonth === new Date().getMonth() && 
                  currentYear === new Date().getFullYear() ? 'today' : ''
                }`}
              >
                {calendarDay.day && (
                  <>
                    <div className="day-number">{calendarDay.day}</div>
                    <div className="day-events">
                      {calendarDay.events.map(event => (
                        <div 
                          key={event.id} 
                          className="event"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDetails(true);
                          }}
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

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading schedule...</p>
          </div>
        )}
      </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
