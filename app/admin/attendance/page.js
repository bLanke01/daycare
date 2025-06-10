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
          <span className="text-primary">Daily</span> Attendance
        </h1>
        
        {/* Filter Controls */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">Age Group</span>
                </label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="All">All Groups</option>
                  <option value="Infant">Infant</option>
                  <option value="Toddler">Toddler</option>
                  <option value="Pre-K">Pre-K</option>
                </select>
              </div>
              
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">Actions</span>
                </label>
                <button 
                  className="btn btn-primary w-full"
                  onClick={generateSheet}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Generate Sheet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Sheet */}
        <div className="card bg-base-100 shadow-xl overflow-x-auto">
          <div className="card-body p-0">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="bg-base-200">
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <th className="bg-base-200">#</th>
                  <th className="bg-base-200">Child Name</th>
                  <th className="bg-base-200">Child ID</th>
                  <th className="bg-base-200">Age</th>
                  <th className="bg-base-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map((child, index) => {
                  const attendance = attendanceData[child.id];
                  const status = attendance?.status;
                  
                  return (
                    <tr key={child.id} className="hover">
                      <td>
                        <label>
                          <input type="checkbox" className="checkbox" />
                        </label>
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                              <span>{child.gender === 'Female' ? '👧' : '👦'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{child.firstName} {child.lastName}</div>
                            <div className="text-sm opacity-50">{child.group}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-ghost">#{child.id.slice(-6)}</div>
                      </td>
                      <td>{calculateAge(child.dateOfBirth)}</td>
                      <td>
                        <div className="join">
                          <button
                            className={`btn btn-sm join-item ${status === 'present' ? 'btn-success' : 'btn-ghost'}`}
                            onClick={() => updateAttendanceStatus(child.id, 'present')}
                            disabled={saving}
                          >
                            Present
                          </button>
                          <button
                            className={`btn btn-sm join-item ${status === 'late' ? 'btn-warning' : 'btn-ghost'}`}
                            onClick={() => updateAttendanceStatus(child.id, 'late')}
                            disabled={saving}
                          >
                            Late
                          </button>
                          <button
                            className={`btn btn-sm join-item ${status === 'absent' ? 'btn-error' : 'btn-ghost'}`}
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
        </div>

        {/* Summary Stats */}
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Children</div>
            <div className="stat-value">{filteredChildren.length}</div>
            <div className="stat-desc">In selected group</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Present</div>
            <div className="stat-value text-success">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'present').length}
            </div>
            <div className="stat-desc text-success">On time</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Late</div>
            <div className="stat-value text-warning">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'late').length}
            </div>
            <div className="stat-desc text-warning">Arrived late</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Absent</div>
            <div className="stat-value text-error">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'absent').length}
            </div>
            <div className="stat-desc text-error">Not present</div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            className={`btn btn-primary ${saving ? 'loading' : ''}`}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Submit Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}