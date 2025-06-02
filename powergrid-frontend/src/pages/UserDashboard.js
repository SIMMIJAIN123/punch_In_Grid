import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { format } from 'date-fns';
import '../styles/Layout.css';
import AttendanceCard from '../components/AttendanceCard';
import moment from 'moment';

export default function UserDashboard() {
  const [stats, setStats] = useState({
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
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(moment().format('MM'));
  const [selectedYear, setSelectedYear] = useState(moment().format('YYYY'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    if (selectedMonth && selectedYear) {
      fetchAttendanceStats();
      fetchUserProfile();
    }
  }, [selectedMonth, selectedYear, navigate]);

  const fetchUserProfile = async () => {
    try {
      // const empId = localStorage.getItem('empId');
      // const email = localStorage.getItem('email');
      // const name = localStorage.getItem('name');
      const name = localStorage.getItem('name') || 'N/A';
      const empId = localStorage.getItem('empId') || 'N/A';
      const email = localStorage.getItem('email') || 'N/A';
      
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

  const fetchAttendanceStats = async () => {
    setLoading(true);
    setError('');

    try {
      const empId = localStorage.getItem('empId');
      if (!empId) {
        throw new Error('Employee ID not found. Please log in again.');
      }

      const startDate = moment(`${selectedYear}-${selectedMonth}-01`).startOf('month').format('YYYY-MM-DD');
      const endDate = moment(`${selectedYear}-${selectedMonth}-01`).endOf('month').format('YYYY-MM-DD');

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: startDate,
          end_date: endDate,
          employee_id: empId
        }
      });

      if (!response.data) {
        throw new Error('No data received from the server');
      }

      if (response.data?.data) {
        const periodData = response.data.data;
        
        // Get today's data if within range
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = today >= startDate && today <= endDate ? 
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

        setStats({
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
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch attendance statistics';
      setError(`Error: ${errorMessage}`);
      console.error('Attendance fetch error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  // Array of months
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Get array of years (last 5 years to current year)
  const getYearOptions = () => {
    const years = [];
    const currentYear = moment().year();
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-gray-800 mb-1">Name: {userProfile.name}</span>
            </div>
          </div>
        </div>

        {/* Check In/Out Card */}
        <div className="mb-6">
          <AttendanceCard user={userProfile} />
        </div>

        {/* Month and Year Filter */}
        <div className="date-range-filter mb-6">
          <div className="flex gap-4 items-center">
            <div className="filter-group">
              <label>Select Month:</label>
              <select
                className="date-selector"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Select Year:</label>
              <select
                className="date-selector"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {getYearOptions().map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <div className="loading-message">Loading attendance data...</div>}
        {error && <div className="error-message">{error}</div>}
          
        {/* Attendance Cards */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">
            My Attendance 
            </h4>
          <div className="attendance-cards">
            <div className="attendance-card">
              <div className="card-title">Period Attendance</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">In-Time Punches</span>
                  <span className="stat-value">{stats.totalInPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Missed In-Time</span>
                  <span className="stat-value">{stats.missedInPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Out-Time Punches</span>
                  <span className="stat-value">{stats.totalOutPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Missed Out-Time</span>
                  <span className="stat-value">{stats.missedOutPunches}</span>
                </div>
              </div>
            </div>
            
            {/* <div className="attendance-card">
              <div className="card-title">Today's Status</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Punch In</span>
                  <span className="stat-value">{stats.todayPunchIn}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Punch Out</span>
                  <span className="stat-value">{stats.todayPunchOut}</span>
                </div>
              </div>
            </div> */}
            
            <div className="attendance-card">
              <div className="card-title">Overtime</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Period Total</span>
                  <span className="stat-value">
                    {Math.floor(stats.periodOvertime / 60)}h {stats.periodOvertime % 60}m
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">
                    {Math.floor(stats.todayOvertime / 60)}h {stats.todayOvertime % 60}m
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
                    {Math.floor(stats.periodLate / 60)}h {stats.periodLate % 60}m
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">
                    {Math.floor(stats.todayLate / 60)}h {stats.todayLate % 60}m
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
