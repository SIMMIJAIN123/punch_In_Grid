import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { format } from 'date-fns';
import '../styles/Layout.css';

export default function LoggedInUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return {
      startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
      endDate: format(currentDate, 'yyyy-MM-dd')
    };
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (expandedUser && dateRange.startDate && dateRange.endDate) {
      fetchUserAttendance(expandedUser);
    }
  }, [dateRange, expandedUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/logged_in_users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const usersList = response.data?.data || [];
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching logged in users:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttendance = async (empId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          employee_id: empId
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const attendanceData = response.data?.data || [];
      const stats = calculateAttendanceStats(attendanceData);
      setAttendanceStats(stats);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = (attendanceData) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayData = today >= dateRange.startDate && today <= dateRange.endDate ? 
      attendanceData.find(record => record.date === today) || {} : 
      {};

    // Calculate in-time and out-time statistics
    const totalInPunches = attendanceData.filter(record => 
      record.intime && record.intime !== '--:--'
    ).length;

    const missedInPunches = attendanceData.filter(record => 
      !record.intime || record.intime === '--:--'
    ).length;

    const totalOutPunches = attendanceData.filter(record => 
      record.outtime && record.outtime !== '--:--'
    ).length;

    const missedOutPunches = attendanceData.filter(record => 
      !record.outtime || record.outtime === '--:--'
    ).length;

    const periodOvertime = attendanceData.reduce((total, record) => {
      if (record.overtime && record.overtime !== '--:--') {
        return total + parseTimeToMinutes(record.overtime);
      }
      return total;
    }, 0);

    const periodLate = attendanceData.reduce((total, record) => {
      if (record.late_in && record.late_in !== '--:--') {
        return total + parseTimeToMinutes(record.late_in);
      }
      return total;
    }, 0);

    const todayOvertime = todayData.overtime ? parseTimeToMinutes(todayData.overtime) : 0;
    const todayLate = todayData.late_in ? parseTimeToMinutes(todayData.late_in) : 0;
    
    return {
      totalInPunches,
      missedInPunches,
      totalOutPunches,
      missedOutPunches,
      todayPunchIn: todayData.intime || '--:--',
      todayPunchOut: todayData.outtime || '--:--',
      periodOvertime,
      todayOvertime,
      periodLate,
      todayLate
    };
  };

  const parseTimeToMinutes = (timeStr) => {
    if (timeStr === '--:--' || !timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  const handleUserClick = async (user) => {
    if (expandedUser === user.emp_id) {
      setExpandedUser(null);
      setSelectedUser(null);
      setAttendanceStats(null);
    } else {
      setExpandedUser(user.emp_id);
      setSelectedUser(user);
      await fetchUserAttendance(user.emp_id);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prevRange => ({
      ...prevRange,
      [name]: value
    }));
  };

  const handleError = (err) => {
    if (err.response?.status === 403) {
      setError('You do not have permission to view this page. You must be an admin.');
    } else if (err.response?.status === 401) {
      setError('Your session has expired. Please log in again.');
    } else {
      setError(err.response?.data?.detail || 'Failed to fetch data. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Logged In Users</h2>

        {/* Date Range Filter */}
        <div className="date-range-filter mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
          <div className="flex gap-4 items-center">
            <div className="filter-group">
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                max={dateRange.endDate}
                className="date-input"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                min={dateRange.startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="date-input"
              />
            </div>
          </div>
        </div>

        {loading && <div className="loading-message">Loading data...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="users-list">
            {users.length > 0 ? users.map((user) => (
              <div key={user.emp_id} className="user-accordion-item">
                <div 
                  className="user-accordion-header"
                  onClick={() => handleUserClick(user)}
                >
                  <span>{user.name || 'Unknown'} ({user.email || 'No email'})</span>
                  <span>{expandedUser === user.emp_id ? '▼' : '▶'}</span>
                </div>
                
                {expandedUser === user.emp_id && attendanceStats && (
                  <div className="user-accordion-content">
                    <h4 className="text-lg font-semibold mb-4">
                      {user.name}'s Attendance ({dateRange.startDate} to {dateRange.endDate})
                    </h4>
                    <div className="attendance-cards">
                      <div className="attendance-card">
                        <div className="card-title">Period Attendance</div>
                        <div className="card-content">
                          <div className="stat-item">
                            <span className="stat-label">In-Time Punches</span>
                            <span className="stat-value">{attendanceStats.totalInPunches}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Missed In-Time</span>
                            <span className="stat-value">{attendanceStats.missedInPunches}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Out-Time Punches</span>
                            <span className="stat-value">{attendanceStats.totalOutPunches}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Missed Out-Time</span>
                            <span className="stat-value">{attendanceStats.missedOutPunches}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="attendance-card">
                        <div className="card-title">Today's Status</div>
                        <div className="card-content">
                          <div className="stat-item">
                            <span className="stat-label">Punch In</span>
                            <span className="stat-value">{attendanceStats.todayPunchIn}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Punch Out</span>
                            <span className="stat-value">{attendanceStats.todayPunchOut}</span>
                          </div>
                        </div>
                      </div>

                      <div className="attendance-card">
                        <div className="card-title">Overtime</div>
                        <div className="card-content">
                          <div className="stat-item">
                            <span className="stat-label">Period Total</span>
                            <span className="stat-value">
                              {Math.floor(attendanceStats.periodOvertime / 60)}h {attendanceStats.periodOvertime % 60}m
                            </span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Today</span>
                            <span className="stat-value">
                              {Math.floor(attendanceStats.todayOvertime / 60)}h {attendanceStats.todayOvertime % 60}m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="attendance-card">
                        <div className="card-title">Late Arrivals</div>
                        <div className="card-content">
                          <div className="stat-item">
                            <span className="stat-label">Period Total</span>
                            <span className="stat-value">
                              {Math.floor(attendanceStats.periodLate / 60)}h {attendanceStats.periodLate % 60}m
                            </span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Today</span>
                            <span className="stat-value">
                              {Math.floor(attendanceStats.todayLate / 60)}h {attendanceStats.todayLate % 60}m
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div>No users are currently logged in.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


