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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = moment();
    return {
      startDate: currentDate.startOf('month').format('YYYY-MM-DD'),
      endDate: currentDate.endOf('month').format('YYYY-MM-DD')
    };
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAttendanceToday: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  });

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAdminAttendance();
      fetchUserProfile();
    }
    fetchAllUsers();
    fetchTodayStats();
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
    
    // Handle HH:mm format
    if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours * 60) + minutes;
    }
    
    // If it's just minutes as a string
    const mins = parseInt(timeStr);
    return isNaN(mins) ? 0 : mins;
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
        
        // Get today's data
        const today = moment().format('YYYY-MM-DD');
        const todayData = periodData.find(record => record.date === today) || {};

        // Calculate in-time and out-time statistics for the period
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

        // Calculate overtime for the period
        const periodOvertime = periodData.reduce((sum, record) => {
          const overtimeMinutes = convertTimeToMinutes(record.overtime);
          return sum + overtimeMinutes;
        }, 0);

        // Calculate late arrivals for the period
        const periodLate = periodData.reduce((sum, record) => {
          const lateMinutes = convertTimeToMinutes(record.late_in);
          return sum + lateMinutes;
        }, 0);

        // Calculate today's metrics
        const todayOvertime = convertTimeToMinutes(todayData.overtime);
        const todayLate = convertTimeToMinutes(todayData.late_in);

        setAdminStats({
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
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/users');
      setAllUsers(response.data || []);
      setStats(prev => ({
        ...prev,
        totalUsers: response.data.length,
        activeUsers: response.data.filter(user => user.is_active === true).length
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users data');
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = moment().format('YYYY-MM-DD');
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/daily', {
        params: { date: today }
      });

      const attendanceData = response.data || [];
      setStats(prev => ({
        ...prev,
        totalAttendanceToday: attendanceData.length,
        presentToday: attendanceData.filter(record => record.intime && record.intime !== '--:--').length,
        absentToday: prev.totalUsers - attendanceData.filter(record => record.intime && record.intime !== '--:--').length,
        lateToday: attendanceData.filter(record => record.late_in && record.late_in !== '00:00').length
      }));
    } catch (err) {
      console.error('Error fetching today\'s stats:', err);
      setError('Failed to fetch attendance statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of all users and today's attendance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Users</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Attendance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Late Arrivals</h3>
            <div>
              <p className="text-sm text-gray-600">Today's Late Check-ins</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lateToday}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user, index) => (
                  <tr key={user.emp_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.emp_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.shift || 'Not Assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.today_status || 'Not Checked In'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
