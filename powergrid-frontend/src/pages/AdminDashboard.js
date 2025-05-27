import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import Select from 'react-select';
import { format } from 'date-fns';
import '../styles/Layout.css';

export default function AdminDashboard() {
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

  useEffect(() => {
    fetchAttendanceStats();
  }, [selectedMonth, selectedYear]);

  const fetchAttendanceStats = async () => {
    setLoading(true);
    setError('');

    try {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      const today = format(new Date(), 'yyyy-MM-dd');

      console.log('Fetching attendance data with params:', {
        start_date: firstDay,
        end_date: lastDay
      });

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: firstDay,
          end_date: lastDay
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

        {/* Attendance Overview Section */}
        <header className="dashboard-header">
          <div className="month-selector-container">
            <h3 className="dashboard-title">Attendance Overview</h3>
            <div className="month-selector">
              <label>View data for: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</label>
            </div>
          </div>
          
          <div className="attendance-cards">
            <div className="attendance-card">
              <div className="card-title">Monthly Attendance</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Total Punches</span>
                  <span className="stat-value">{stats.totalPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Missed Punches</span>
                  <span className="stat-value">{stats.missedPunches}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Today's Status</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Intime</span>
                  <span className="stat-value">{stats.todayPunchIn}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Outtime</span>
                  <span className="stat-value">{stats.todayPunchOut}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Overtime</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Monthly Total</span>
                  <span className="stat-value">{Math.floor(stats.monthlyOvertime / 60)}h {stats.monthlyOvertime % 60}m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{Math.floor(stats.todayOvertime / 60)}h {stats.todayOvertime % 60}m</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Late Arrivals</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Monthly Total</span>
                  <span className="stat-value">{stats.monthlyLate}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{stats.todayLate}</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}
