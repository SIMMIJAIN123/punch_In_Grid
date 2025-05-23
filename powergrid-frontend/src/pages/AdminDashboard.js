import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import Select from 'react-select';
import { Link } from 'react-router-dom';
// import './AttendanceFilter.css';

export default function AdminDashboard() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data');
      if (response.data?.data) {
        const uniqueEmployees = new Map();
        response.data.data.forEach(record => {
          if (record.empcode && record.name) {
            uniqueEmployees.set(record.empcode, record.name);
          }
        });
        
        const employeeOptions = Array.from(uniqueEmployees).map(([code, name]) => ({
          value: code,
          label: `${name} (${code})`
        }));
        setEmployees(employeeOptions);
      }
    } catch (err) {
      setError('Failed to fetch employee list');
    }
  };

  const fetchAttendanceStats = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) {
      setError('Please select all filters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const firstDay = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: firstDay,
          end_date: lastDay,
          name: selectedEmployee.label.split(' (')[0]
        }
      });

      if (response.data) {
        setStats({
          totalPunches: response.data.total_punches || 0,
          missedPunches: response.data.missed_punches || 0,
          totalOvertime: response.data.total_overtime || 0
        });
      }
    } catch (err) {
      setError('Failed to fetch attendance statistics');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '45px',
      background: '#f8fafc',
      borderColor: '#e2e8f0',
      '&:hover': {
        borderColor: '#cbd5e1'
      }
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected ? '#3b82f6' : state.isFocused ? '#bfdbfe' : 'white',
      color: state.isSelected ? 'white' : '#1e293b'
    })
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        </div>


        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              options={employees}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="Select Employee"
              isDisabled={loading}
              styles={customSelectStyles}
              className="w-full"
            />
            
            <Select
              options={months}
              value={months.find(m => m.value === selectedMonth)}
              onChange={(option) => setSelectedMonth(option.value)}
              placeholder="Select Month"
              isDisabled={loading}
              styles={customSelectStyles}
              className="w-full"
            />
            
            <Select
              options={years}
              value={years.find(y => y.value === selectedYear)}
              onChange={(option) => setSelectedYear(option.value)}
              placeholder="Select Year"
              isDisabled={loading}
              styles={customSelectStyles}
              className="w-full"
            />
          </div>
          
          <button
            onClick={fetchAttendanceStats}
            disabled={loading || !selectedEmployee || !selectedMonth || !selectedYear}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : 'Get Statistics'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Days Present</span>
                  <span className="text-gray-900 font-medium">{stats.totalPunches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Days Absent</span>
                  <span className="text-gray-900 font-medium">{stats.missedPunches}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overtime</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Hours</span>
                  <span className="text-gray-900 font-medium">
                    {Math.floor(stats.totalOvertime / 60)}h {stats.totalOvertime % 60}m
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Arrival Pattern</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Late Arrivals</span>
                  <span className="text-gray-900 font-medium">{stats.lateArrivals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Arrival</span>
                  <span className="text-gray-900 font-medium">{stats.averageArrivalTime}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Status</h3>
              <div className="space-y-3">
                {todayData ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <span className="text-gray-900 font-medium">{todayData.status || 'Present'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">In Time</span>
                      <span className="text-gray-900 font-medium">{todayData.intime || '--:--'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Out Time</span>
                      <span className="text-gray-900 font-medium">{todayData.outtime || '--:--'}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">No data available</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
