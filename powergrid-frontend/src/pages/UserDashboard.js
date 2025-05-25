import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import Select from 'react-select';
import { format } from 'date-fns';

export default function UserDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalPunches: 0,
    missedPunches: 0,
    todayPunchIn: '--:--',
    todayPunchOut: '--:--',
    monthlyOvertime: 0,
    todayOvertime: 0,
    monthlyLate: 0,
    todayLate: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchAttendanceStats();
  }, [selectedMonth, selectedYear, navigate]);

  const fetchAttendanceStats = async () => {
    setLoading(true);
    setError('');

    try {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      const today = format(new Date(), 'yyyy-MM-dd');
      const empId = localStorage.getItem('empId');

      if (!empId) {
        throw new Error('Employee ID not found. Please log in again.');
      }

      console.log('Fetching attendance data with params:', {
        start_date: firstDay,
        end_date: lastDay,
        employee_id: empId
      });

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: firstDay,
          end_date: lastDay,
          employee_id: empId
        }
      });

      console.log('API Response:', response.data);

      if (!response.data) {
        throw new Error('No data received from the server');
      }

      if (response.data?.data) {
        const monthlyData = response.data.data;
        const todayData = monthlyData.find(record => record.date === today) || {};

        // Calculate statistics
        const totalPunches = monthlyData.filter(record => record.intime).length;
        const missedPunches = monthlyData.filter(record => !record.intime).length;
        const monthlyOvertime = monthlyData.reduce((sum, record) => sum + (parseInt(record.overtime) || 0), 0);
        const monthlyLate = monthlyData.filter(record => record.late_in === 'Y').length;

        setStats({
          totalPunches,
          missedPunches,
          todayPunchIn: todayData.intime || '--:--',
          todayPunchOut: todayData.outtime || '--:--',
          monthlyOvertime,
          todayOvertime: parseInt(todayData.overtime) || 0,
          monthlyLate,
          todayLate: todayData.late_in === 'Y' ? 1 : 0
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

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year, label: year.toString() };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Month/Year Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4 items-center">
            <Select
              options={months}
              value={months.find(m => m.value === selectedMonth)}
              onChange={(option) => setSelectedMonth(option.value)}
              placeholder="Select Month"
              className="w-48"
            />
            <Select
              options={years}
              value={years.find(y => y.value === selectedYear)}
              onChange={(option) => setSelectedYear(option.value)}
              placeholder="Select Year"
              className="w-48"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Box 1: Total & Missed Punches */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Punches</span>
                <span className="text-xl font-semibold text-blue-600">{stats.totalPunches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Missed Punches</span>
                <span className="text-xl font-semibold text-red-600">{stats.missedPunches}</span>
              </div>
            </div>
          </div>

          {/* Box 2: Today's Punch Times */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Punch In</span>
                <span className="text-xl font-semibold text-green-600">{stats.todayPunchIn}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Punch Out</span>
                <span className="text-xl font-semibold text-green-600">{stats.todayPunchOut}</span>
              </div>
            </div>
          </div>

          {/* Box 3: Overtime */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overtime</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Total</span>
                <span className="text-xl font-semibold text-purple-600">
                  {Math.floor(stats.monthlyOvertime / 60)}h {stats.monthlyOvertime % 60}m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Today</span>
                <span className="text-xl font-semibold text-purple-600">
                  {Math.floor(stats.todayOvertime / 60)}h {stats.todayOvertime % 60}m
                </span>
              </div>
            </div>
          </div>

          {/* Box 4: Late Arrivals */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Late Arrivals</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Total</span>
                <span className="text-xl font-semibold text-orange-600">{stats.monthlyLate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Today</span>
                <span className="text-xl font-semibold text-orange-600">{stats.todayLate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
