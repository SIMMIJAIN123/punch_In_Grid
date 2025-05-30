import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { format } from 'date-fns';
import '../styles/Layout.css';

export default function AdminDashboard() {
  const [adminStats, setAdminStats] = useState({
    totalInPunches: 0,
    missedInPunches: 0,
    totalOutPunches: 0,
    missedOutPunches: 0,
    todayPunchIn: '--:--',
    todayPunchOut: '--:--',
    periodOvertime: 0,
    todayOvertime: 0,
    periodLate: 0,
    todayLate: 0
  });
  const [userProfile, setUserProfile] = useState({
    name: '',
    empId: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return {
      startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
      endDate: format(currentDate, 'yyyy-MM-dd')
    };
  });

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAdminAttendance();
      fetchUserProfile();
    }
  }, [dateRange]);

  const fetchUserProfile = async () => {
    try {
      const empId = localStorage.getItem('empId');
      const email = localStorage.getItem('email');
      const name = localStorage.getItem('name');
      
      setUserProfile({
        name: name || '',
        empId: empId || '',
        email: email || ''
      });
    } catch (err) {
      console.error('Error setting user profile:', err);
    }
  };

  const convertTimeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === '--:--' || timeStr === '00:00') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  const fetchAdminAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const empId = localStorage.getItem('empId');

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          employee_id: empId
        }
      });

      if (response.data?.data) {
        const periodData = response.data.data;
        
        // Get today's data if within range
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = today >= dateRange.startDate && today <= dateRange.endDate ? 
          periodData.find(record => record.date === today) || {} : 
          {};

        // Calculate in-time and out-time statistics
        const totalInPunches = periodData.filter(record => 
          record.intime && record.intime !== '--:--'
        ).length;

        const missedInPunches = periodData.filter(record => 
          !record.intime || record.intime === '--:--'
        ).length;

        const totalOutPunches = periodData.filter(record => 
          record.outtime && record.outtime !== '--:--'
        ).length;

        const missedOutPunches = periodData.filter(record => 
          !record.outtime || record.outtime === '--:--'
        ).length;

        // Calculate overtime
        const periodOvertime = periodData.reduce((sum, record) => {
          if (record.overtime && record.overtime !== '--:--') {
            return sum + convertTimeToMinutes(record.overtime);
          }
          return sum;
        }, 0);

        // Calculate late arrivals
        const periodLate = periodData.reduce((sum, record) => {
          if (record.late_in && record.late_in !== '--:--') {
            return sum + convertTimeToMinutes(record.late_in);
          }
          return sum;
        }, 0);

        setAdminStats({
          totalInPunches,
          missedInPunches,
          totalOutPunches,
          missedOutPunches,
          todayPunchIn: todayData.intime || '--:--',
          todayPunchOut: todayData.outtime || '--:--',
          periodOvertime,
          todayOvertime: todayData.overtime ? convertTimeToMinutes(todayData.overtime) : 0,
          periodLate,
          todayLate: todayData.late_in ? convertTimeToMinutes(todayData.late_in) : 0
        });
      }
    } catch (err) {
      console.error('Error fetching admin attendance:', err);
      setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prevRange => ({
      ...prevRange,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-gray-800 mb-4">Name: {userProfile.name}</span>
              {/* <span className="text-sm text-gray-600 mb-4">Employee ID: {userProfile.empId}</span>
              <span className="text-sm text-gray-600">Email: {userProfile.email}</span> */}
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="date-range-filter mb-6 flex justify-end">
          
          <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
          <div className="flex gap-4 items-end">
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

        {loading && <div className="loading-message">Loading attendance data...</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Admin's Attendance Cards */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">My Attendance 
            {/* ({dateRange.startDate} to {dateRange.endDate}) */}
            </h4>
          <div className="attendance-cards">
            <div className="attendance-card">
              <div className="card-title">Period Attendance</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">In-Time Punches</span>
                  <span className="stat-value">{adminStats.totalInPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Missed In-Time</span>
                  <span className="stat-value">{adminStats.missedInPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Out-Time Punches</span>
                  <span className="stat-value">{adminStats.totalOutPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Missed Out-Time</span>
                  <span className="stat-value">{adminStats.missedOutPunches}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Today's Status</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Punch In</span>
                  <span className="stat-value">{adminStats.todayPunchIn}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Punch Out</span>
                  <span className="stat-value">{adminStats.todayPunchOut}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Overtime</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Period Total</span>
                  <span className="stat-value">
                    {Math.floor(adminStats.periodOvertime / 60)}h {adminStats.periodOvertime % 60}m
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">
                    {Math.floor(adminStats.todayOvertime / 60)}h {adminStats.todayOvertime % 60}m
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
                    {Math.floor(adminStats.periodLate / 60)}h {adminStats.periodLate % 60}m
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">
                    {Math.floor(adminStats.todayLate / 60)}h {adminStats.todayLate % 60}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
