// components/admin/ScheduleCalendar.js - Updated with notification integration
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
import { notificationService } from '../../services/NotificationService';

const ScheduleCalendar = () => {
  // State for current date and events
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        setError('Failed to load events');
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentMonth, currentYear]);
  
  // State for new event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  
  // State for notification processing
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');
  
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
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days = [];
    let day = 1;
    
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDay) {
          week.push(null);
        } else if (day > totalDays) {
          week.push(null);
        } else {
          const currentDate = new Date(year, month, day);
          const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === currentDate.toDateString();
          });
          week.push({ day, events: dayEvents });
          day++;
        }
      }
      days.push(week);
      if (day > totalDays) break;
    }
    
    return days;
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
  
  // Send notifications for new event
  const sendEventNotifications = async (eventData) => {
    try {
      setSendingNotifications(true);
      setNotificationStatus('📧 Sending notifications...');
      
      console.log('🔔 Starting notification process for event:', eventData.title);
      
      // Send notifications to admins
      setNotificationStatus('📧 Notifying administrators...');
      await notificationService.notifyAdminsNewEvent(eventData);
      
      // Send notifications to parents
      setNotificationStatus('📧 Notifying parents...');
      await notificationService.notifyParentsNewEvent(eventData);
      
      setNotificationStatus('✅ All notifications sent successfully!');
      
      // Clear status after a few seconds
      setTimeout(() => {
        setNotificationStatus('');
        setSendingNotifications(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      setNotificationStatus('❌ Error sending some notifications');
      setTimeout(() => {
        setNotificationStatus('');
        setSendingNotifications(false);
      }, 5000);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Create a date object that preserves the selected date
      const [year, month, day] = newEvent.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // month is 0-based in Date constructor
      
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
        
        setNotificationStatus('📝 Event updated successfully!');
      } else {
        // Add new event
        const docRef = await addDoc(collection(db, 'events'), eventData);
        const newEventWithId = { ...eventData, id: docRef.id, date: dateObj };
        
        setEvents([...events, newEventWithId]);
        
        // Send notifications for new events only
        await sendEventNotifications(newEventWithId);
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
      setError('Failed to save event');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle event deletion
  const handleDeleteEvent = async (eventId) => {
    try {
      setLoading(true);
      setError(null);

      await deleteDoc(doc(db, 'events', eventId));
      setEvents(events.filter(event => event.id !== eventId));
      setShowEventDetails(false);
      setNotificationStatus('🗑️ Event deleted successfully');
      setTimeout(() => setNotificationStatus(''), 3000);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };
  
  // Format month and year for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const calendarDays = generateCalendarDays();
  
  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content">
          <span className="text-primary">Schedule</span> Calendar
        </h1>

        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Calendar Header */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className="btn btn-circle btn-ghost"
                  onClick={goToPreviousMonth}
                >
                  ❮
                </button>
                <h2 className="text-2xl font-bold">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  className="btn btn-circle btn-ghost"
                  onClick={goToNextMonth}
                >
                  ❯
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedDate(new Date());
                  setNewEvent({
                    ...newEvent,
                    date: new Date().toISOString().split('T')[0]
                  });
                  setShowEventForm(true);
                }}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="card bg-base-100 shadow-xl overflow-x-auto">
          <div className="card-body p-0">
            <table className="table table-fixed w-full">
              <thead>
                <tr>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <th key={day} className="bg-base-200 text-center py-4">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarDays.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((dayData, dayIndex) => (
                      <td
                        key={dayIndex}
                        className={`h-32 p-2 align-top border border-base-200 ${
                          dayData ? 'hover:bg-base-200' : 'bg-base-200/50'
                        }`}
                      >
                        {dayData && (
                          <>
                            <div className="text-right mb-2">
                              <span className={`inline-block rounded-full w-6 h-6 text-center leading-6 ${
                                new Date(currentYear, currentMonth, dayData.day).toDateString() === today.toDateString()
                                  ? 'bg-primary text-primary-content'
                                  : ''
                              }`}>
                                {dayData.day}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {dayData.events.map((event) => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-1 rounded cursor-pointer truncate ${
                                    event.type === 'activity'
                                      ? 'bg-primary/20 text-primary-content'
                                      : event.type === 'holiday'
                                      ? 'bg-secondary/20 text-secondary-content'
                                      : 'bg-accent/20 text-accent-content'
                                  }`}
                                  onClick={(e) => handleEventClick(event, e)}
                                >
                                  {event.title}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => {
                  setShowEventForm(false);
                  setNewEvent({
                    title: '',
                    date: '',
                    group: '',
                    time: '',
                    description: ''
                  });
                }}
              >
                ✕
              </button>
              
              <h3 className="font-bold text-lg mb-4">
                {selectedEvent ? 'Edit Event' : 'Add New Event'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    name="title"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    name="description"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={newEvent.date}
                      onChange={handleInputChange}
                      name="date"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Group</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={newEvent.group}
                      onChange={handleInputChange}
                      name="group"
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

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Time</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered"
                      value={newEvent.time}
                      onChange={handleInputChange}
                      name="time"
                      required
                    />
                  </div>
                </div>

                <div className="modal-action">
                  {selectedEvent && (
                    <button
                      type="button"
                      className="btn btn-error"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this event?')) {
                          handleDeleteEvent(selectedEvent.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowEventForm(false);
                      setNewEvent({
                        title: '',
                        date: '',
                        group: '',
                        time: '',
                        description: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {selectedEvent ? 'Update Event' : 'Add Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification Status */}
        {notificationStatus && (
          <div className={`notification-status ${sendingNotifications ? 'processing' : 'success'}`}>
            {sendingNotifications && <div className="notification-spinner"></div>}
            {notificationStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCalendar;