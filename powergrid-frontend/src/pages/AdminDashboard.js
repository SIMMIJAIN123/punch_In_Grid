import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { format } from 'date-fns';
import '../styles/Layout.css';
import AttendanceCard from '../components/AttendanceCard';
import moment from 'moment';

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
    email: '',
    shift: ''
  });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = moment();
    return {
      startDate: currentDate.startOf('month').format('YYYY-MM-DD'),
      endDate: currentDate.endOf('month').format('YYYY-MM-DD')
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
      const shift = localStorage.getItem('shift');

      
      setUserProfile({
        name: name || '',
        empId: empId || '',
        email: email || '',
        shift: shift || ''
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
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const setCurrentMonth = () => {
    const currentDate = moment();
    setDateRange({
      startDate: currentDate.startOf('month').format('YYYY-MM-DD'),
      endDate: currentDate.endOf('month').format('YYYY-MM-DD')
    });
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAllUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                {/* <span className="text-xl font-semibold text-gray-800">Admin Dashboard</span> */}
                {/* <div className="bg-purple-100 px-3 py-1 rounded-full">
                  <span className="text-sm text-purple-700">Admin</span>
                </div> */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{userProfile.name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Employee ID:</span>
                  <span className="ml-2 font-medium">{userProfile.empId}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{userProfile.email}</span>
                </div>
                <div className="bg-blue-50 p-2 rounded-md">
                  <span className="text-sm text-blue-800">Current Shift:</span>
                  <span className="ml-2 font-medium text-blue-900">{userProfile.shift || 'Not assigned'}</span>
                  <p className="text-xs text-blue-600 mt-1">
                    {userProfile.shift === '4' ? 'Shift Hours: 5:30 PM - 2:30 AM' : 'Shift Hours: Not Available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Check In/Out Card */}
        <div className="mb-6">
          <AttendanceCard user={userProfile} />
        </div>

        {/* All Users Section */}
        {/* <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">All Users & Shifts</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user, index) => (
                    <tr key={user.emp_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.emp_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.shift || 'Not assigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.shift === '4' ? '5:30 PM - 2:30 AM' : 'Not Available'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div> */}

        {/* Date Range Filter */}
        <div className="date-range-filter mb-6">
          <div className="flex items-center justify-between">
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
                  max={moment().format('YYYY-MM-DD')}
                  className="date-input"
                />
              </div>
              <button
                onClick={setCurrentMonth}
                className="current-month-btn"
              >
                Current Month
              </button>
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
            
            {/* <div className="attendance-card">
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
            </div> */}
            
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

        <style jsx>{`
          .date-input {
            padding: 0.5rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #4a5568;
            background-color: white;
            min-width: 150px;
          }

          .date-input:focus {
            outline: none;
            border-color: #4299e1;
            box-shadow: 0 0 0 1px #4299e1;
          }

          .current-month-btn {
            padding: 0.5rem 1rem;
            background-color: #4299e1;
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .current-month-btn:hover {
            background-color: #3182ce;
          }

          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .filter-group label {
            font-size: 0.875rem;
            color: #4a5568;
            font-weight: 500;
          }
        `}</style>
      </div>
    </div>
  );
}
