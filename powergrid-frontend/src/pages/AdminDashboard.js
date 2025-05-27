import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import Select from 'react-select';
import { format } from 'date-fns';
import '../styles/Layout.css';

export default function AdminDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalPunches: 0,
    missedPunches: 0,
    todayPunchIn: '--:--',
    todayPunchOut: '--:--',
    monthlyOvertime: 0,
    todayOvertime: 0,
    monthlyLate: 0,
    todayLate: 0
  });
  const [overallStats, setOverallStats] = useState({
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
    fetchAdminAttendance();
    fetchEmployees();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeAttendance();
    }
  }, [selectedEmployee, selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: firstDay,
          end_date: lastDay
        }
      });

      if (response.data?.data) {
        // Get unique employees from attendance records
        const uniqueEmployees = Array.from(new Set(
          response.data.data.map(record => JSON.stringify({
            empcode: record.empcode,
            name: record.name
          }))
        )).map(str => JSON.parse(str));

        const employeeOptions = uniqueEmployees
          .filter(emp => emp.empcode && emp.name) // Filter out any invalid entries
          .map(emp => ({
            value: emp.empcode,
            label: `${emp.name} (${emp.empcode})`
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

        setEmployees(employeeOptions);
      }
    } catch (err) {
      console.error('Error fetching employees from attendance records:', err);
    }
  };

  const fetchEmployeeAttendance = async () => {
    if (!selectedEmployee) return;

    try {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      const today = format(new Date(), 'yyyy-MM-dd');

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: firstDay,
          end_date: lastDay,
          employee_id: selectedEmployee.value
        }
      });

      if (response.data?.data) {
        const monthlyData = response.data.data;
        const todayData = monthlyData.find(record => record.date === today) || {};

        // Helper function to convert time string to minutes
        const convertTimeToMinutes = (timeStr) => {
          if (!timeStr || timeStr === '00:00') return 0;
          const [hours, minutes] = timeStr.split(':').map(Number);
          return (hours * 60) + minutes;
        };

        // Calculate selected employee's statistics
        const totalPunches = monthlyData.filter(record => record.intime).length;
        const missedPunches = monthlyData.filter(record => !record.intime).length;
        const monthlyOvertime = monthlyData.reduce((sum, record) => sum + (parseInt(record.overtime) || 0), 0);
        
        // Calculate total late minutes for the month for selected employee
        const monthlyLateMinutes = monthlyData.reduce((sum, record) => {
          const lateMinutes = convertTimeToMinutes(record.late_in);
          return sum + lateMinutes;
        }, 0);

        setOverallStats({
          totalPunches,
          missedPunches,
          todayPunchIn: todayData.intime || '--:--',
          todayPunchOut: todayData.outtime || '--:--',
          monthlyOvertime,
          todayOvertime: parseInt(todayData.overtime) || 0,
          monthlyLate: monthlyLateMinutes,
          todayLate: convertTimeToMinutes(todayData.late_in)
        });
      }
    } catch (err) {
      console.error('Error fetching employee attendance:', err);
    }
  };

  const fetchAdminAttendance = async () => {
    try {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      const today = format(new Date(), 'yyyy-MM-dd');
      const empId = localStorage.getItem('empId');

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: firstDay,
          end_date: lastDay,
          employee_id: empId
        }
      });

      if (response.data?.data) {
        const monthlyData = response.data.data;
        const todayData = monthlyData.find(record => record.date === today) || {};

        // Helper function to convert time string to minutes
        const convertTimeToMinutes = (timeStr) => {
          if (!timeStr || timeStr === '00:00') return 0;
          const [hours, minutes] = timeStr.split(':').map(Number);
          return (hours * 60) + minutes;
        };

        // Calculate admin's statistics
        const totalPunches = monthlyData.filter(record => record.intime).length;
        const missedPunches = monthlyData.filter(record => !record.intime).length;
        const monthlyOvertime = monthlyData.reduce((sum, record) => sum + (parseInt(record.overtime) || 0), 0);
        
        // Calculate total late minutes for the month for admin
        const monthlyLateMinutes = monthlyData.reduce((sum, record) => {
          const lateMinutes = convertTimeToMinutes(record.late_in);
          return sum + lateMinutes;
        }, 0);

        setAdminStats({
          totalPunches,
          missedPunches,
          todayPunchIn: todayData.intime || '--:--',
          todayPunchOut: todayData.outtime || '--:--',
          monthlyOvertime,
          todayOvertime: parseInt(todayData.overtime) || 0,
          monthlyLate: monthlyLateMinutes,
          todayLate: convertTimeToMinutes(todayData.late_in)
        });
      }
    } catch (err) {
      console.error('Error fetching admin attendance:', err);
    }
  };

  const fetchAttendanceStats = async () => {
    setLoading(true);
    setError('');

    try {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      const today = format(new Date(), 'yyyy-MM-dd');

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: firstDay,
          end_date: lastDay
        }
      });

      if (response.data?.data) {
        const monthlyData = response.data.data;
        const todayData = monthlyData.find(record => record.date === today) || {};

        // Helper function to convert time string to minutes
        const convertTimeToMinutes = (timeStr) => {
          if (!timeStr || timeStr === '00:00') return 0;
          const [hours, minutes] = timeStr.split(':').map(Number);
          return (hours * 60) + minutes;
        };

        // Calculate overall statistics
        const totalPunches = monthlyData.filter(record => record.intime).length;
        const missedPunches = monthlyData.filter(record => !record.intime).length;
        const monthlyOvertime = monthlyData.reduce((sum, record) => sum + (parseInt(record.overtime) || 0), 0);
        
        // Calculate total late minutes for the month
        const monthlyLateMinutes = monthlyData.reduce((sum, record) => {
          const lateMinutes = convertTimeToMinutes(record.late_in);
          return sum + lateMinutes;
        }, 0);
        
        setOverallStats({
          totalPunches,
          missedPunches,
          todayPunchIn: todayData.intime || '--:--',
          todayPunchOut: todayData.outtime || '--:--',
          monthlyOvertime,
          todayOvertime: parseInt(todayData.overtime) || 0,
          monthlyLate: monthlyLateMinutes,
          todayLate: convertTimeToMinutes(todayData.late_in)
        });
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch attendance statistics';
      setError(`Error: ${errorMessage}`);
      console.error('Attendance fetch error:', err);
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
        {/* Month, Year, and Employee Selector */}
        <div className="month-selector-container mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="dashboard-title">Attendance Overview</h3>
            <div className="flex gap-2 flex-wrap">
              <Select
                options={months}
                value={months.find(m => m.value === selectedMonth)}
                onChange={(option) => setSelectedMonth(option.value)}
                placeholder="Month"
                className="text-sm min-w-[120px]"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '32px',
                    height: '32px'
                  })
                }}
              />
              <Select
                options={years}
                value={years.find(y => y.value === selectedYear)}
                onChange={(option) => setSelectedYear(option.value)}
                placeholder="Year"
                className="text-sm min-w-[100px]"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '32px',
                    height: '32px'
                  })
                }}
              />
              <Select
                options={employees}
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                placeholder="Select Employee"
                className="text-sm min-w-[200px]"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '32px',
                    height: '32px'
                  })
                }}
                isClearable
              />
            </div>
          </div>
        </div>

        {/* Admin's Personal Attendance */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">My Attendance</h4>
          <div className="attendance-cards">
            <div className="attendance-card">
              <div className="card-title">Monthly Attendance</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Total Punches</span>
                  <span className="stat-value">{adminStats.totalPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Missed Punches</span>
                  <span className="stat-value">{adminStats.missedPunches}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Today's Status</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Intime</span>
                  <span className="stat-value">{adminStats.todayPunchIn}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Outtime</span>
                  <span className="stat-value">{adminStats.todayPunchOut}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Overtime</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Monthly Total</span>
                  <span className="stat-value">{Math.floor(adminStats.monthlyOvertime / 60)}h {adminStats.monthlyOvertime % 60}m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{Math.floor(adminStats.todayOvertime / 60)}h {adminStats.todayOvertime % 60}m</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Late Arrivals</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Monthly Total</span>
                  <span className="stat-value">{Math.floor(adminStats.monthlyLate / 60)}h {adminStats.monthlyLate % 60}m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{Math.floor(adminStats.todayLate / 60)}h {adminStats.todayLate % 60}m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Employee or Overall Attendance Stats */}
        <div>
          <h4 className="text-lg font-semibold mb-4">
            {selectedEmployee ? `${selectedEmployee.label}'s Attendance` : 'Overall Attendance'}
          </h4>
          <div className="attendance-cards">
            <div className="attendance-card">
              <div className="card-title">Monthly Attendance</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Total Punches</span>
                  <span className="stat-value">{overallStats.totalPunches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Missed Punches</span>
                  <span className="stat-value">{overallStats.missedPunches}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Today's Overall</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Present Today</span>
                  <span className="stat-value">{overallStats.todayPunchIn !== '--:--' ? 'Yes' : 'No'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Left Today</span>
                  <span className="stat-value">{overallStats.todayPunchOut !== '--:--' ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Total Overtime</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Monthly Total</span>
                  <span className="stat-value">{Math.floor(overallStats.monthlyOvertime / 60)}h {overallStats.monthlyOvertime % 60}m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{Math.floor(overallStats.todayOvertime / 60)}h {overallStats.todayOvertime % 60}m</span>
                </div>
              </div>
            </div>
            
            <div className="attendance-card">
              <div className="card-title">Late Arrivals</div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Monthly Total</span>
                  <span className="stat-value">{Math.floor(overallStats.monthlyLate / 60)}h {overallStats.monthlyLate % 60}m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{Math.floor(overallStats.todayLate / 60)}h {overallStats.todayLate % 60}m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
