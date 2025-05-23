// app/admin/attendance/page.js - Attendance Sheet Design
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AttendancePage() {
  const [children, setChildren] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterGroup, setFilterGroup] = useState('All');

  // Load children and attendance data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all children
        const childrenSnapshot = await getDocs(
          query(collection(db, 'children'), orderBy('firstName'))
        );
        
        const childrenList = [];
        childrenSnapshot.forEach(doc => {
          childrenList.push({ id: doc.id, ...doc.data() });
        });
        
        setChildren(childrenList);
        
        // Load attendance for selected date
        const attendanceSnapshot = await getDocs(
          query(
            collection(db, 'attendance'),
            where('date', '>=', selectedDate + 'T00:00:00.000Z'),
            where('date', '<=', selectedDate + 'T23:59:59.999Z')
          )
        );
        
        const todayAttendance = {};
        attendanceSnapshot.forEach(doc => {
          const data = doc.data();
          todayAttendance[data.childId] = {
            id: doc.id,
            ...data
          };
        });
        
        setAttendanceData(todayAttendance);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Update attendance status
  const updateAttendanceStatus = async (childId, status) => {
    setSaving(true);
    
    try {
      const child = children.find(c => c.id === childId);
      const attendanceId = `${childId}_${selectedDate}`;
      
      const attendanceRecord = {
        childId,
        childName: `${child.firstName} ${child.lastName}`,
        date: new Date(selectedDate).toISOString(),
        status,
        arrivalTime: status === 'present' || status === 'late' ? 
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
        departureTime: null,
        notes: '',
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };
      
      await setDoc(doc(db, 'attendance', attendanceId), attendanceRecord);
      
      // Update local state
      setAttendanceData(prev => ({
        ...prev,
        [childId]: { id: attendanceId, ...attendanceRecord }
      }));
      
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  // Generate attendance sheet
  const generateSheet = () => {
    console.log('Generating attendance sheet for:', selectedDate);
    console.log('Attendance data:', attendanceData);
    alert('Attendance sheet generated! (This would export to PDF/Excel in a real implementation)');
  };

  // Filter children by group
  const filteredChildren = children.filter(child => 
    filterGroup === 'All' || child.group === filterGroup
  );

  // Calculate age for grouping
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 1) {
      const ageMonths = (today.getMonth() + 12 - birthDate.getMonth()) % 12;
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return <div className="loading">Loading attendance data...</div>;
  }

  return (
    <div className="attendance-container">
      <h1 className="page-title">Attendance</h1>
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="ageGroup">Age Group</label>
          <select
            id="ageGroup"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="Infant">Infant</option>
            <option value="Toddler">Toddler</option>
            <option value="Pre-K">Pre-K</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-select"
          />
        </div>
        
        <button 
          className="generate-btn"
          onClick={generateSheet}
        >
          Generate Sheet
        </button>
      </div>

      {/* Attendance Sheet */}
      <div className="attendance-sheet">
        <h2 className="sheet-title">Attendance Sheet</h2>
        
        <div className="sheet-table">
          <table>
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" />
                </th>
                <th className="number-col">#</th>
                <th className="name-col">Child Name</th>
                <th className="id-col">Child ID</th>
                <th className="age-col">Age</th>
                <th className="status-col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredChildren.map((child, index) => {
                const attendance = attendanceData[child.id];
                const status = attendance?.status;
                
                return (
                  <tr key={child.id} className="attendance-row">
                    <td className="checkbox-col">
                      <input type="checkbox" />
                    </td>
                    <td className="number-col">{index + 1}</td>
                    <td className="name-col">
                      <div className="child-name-container">
                        <span className="child-avatar">
                          {child.gender === 'Female' ? '👧' : '👦'}
                        </span>
                        {child.firstName} {child.lastName}
                      </div>
                    </td>
                    <td className="id-col">#{child.id.slice(-6)}</td>
                    <td className="age-col">{calculateAge(child.dateOfBirth)}</td>
                    <td className="status-col">
                      <div className="status-buttons">
                        <button
                          className={`status-btn present ${status === 'present' ? 'active' : ''}`}
                          onClick={() => updateAttendanceStatus(child.id, 'present')}
                          disabled={saving}
                        >
                          Present
                        </button>
                        <button
                          className={`status-btn late ${status === 'late' ? 'active' : ''}`}
                          onClick={() => updateAttendanceStatus(child.id, 'late')}
                          disabled={saving}
                        >
                          Late
                        </button>
                        <button
                          className={`status-btn absent ${status === 'absent' ? 'active' : ''}`}
                          onClick={() => updateAttendanceStatus(child.id, 'absent')}
                          disabled={saving}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="sheet-footer">
          <button className="submit-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="attendance-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{filteredChildren.length}</span>
          </div>
          <div className="stat-item present">
            <span className="stat-label">Present:</span>
            <span className="stat-value">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'present').length}
            </span>
          </div>
          <div className="stat-item late">
            <span className="stat-label">Late:</span>
            <span className="stat-value">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'late').length}
            </span>
          </div>
          <div className="stat-item absent">
            <span className="stat-label">Absent:</span>
            <span className="stat-value">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'absent').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}