import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from '../api/axiosConfig';
import Select from 'react-select';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
  const userRole = localStorage.getItem('role');
  const location = useLocation();
  const currentPath = location.pathname;
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [attendanceData, setAttendanceData] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [error, setError] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);

  const isDashboardPage = currentPath === '/admin-dashboard' || currentPath === '/user-dashboard';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data');
      
      if (response.data && Array.isArray(response.data.data)) {
        const uniqueEmployees = new Set();
        const options = [];
        
        response.data.data.forEach(record => {
          const key = `${record.empcode}-${record.name}`;
          if (!uniqueEmployees.has(key) && record.name && record.empcode) {
            uniqueEmployees.add(key);
            options.push({
              value: record.empcode,
              label: `${record.name} (${record.empcode})`
            });
          }
        });
        
        setEmployeeOptions(options);
      }
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newDateRange = {
      ...dateRange,
      [name]: value
    };
    setDateRange(newDateRange);
    if (selectedEmployee) {
      fetchAttendanceData(selectedEmployee, newDateRange);
    }
  };

  const fetchAttendanceData = async (employee, dates) => {
    if (!employee || !dates.start || !dates.end) return;
  
    try {
      setLoading(true);
      setError('');
      
      // Convert dates to YYYY-MM-DD format
      const startDate = new Date(dates.start).toISOString().split('T')[0];
      const endDate = new Date(dates.end).toISOString().split('T')[0];
  
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          employee_id: employee.value,
          start_date: startDate,
          end_date: endDate
        }
      });
  
      if (response.data && Array.isArray(response.data.data)) {
        const records = response.data.data.filter(record => {
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          return recordDate >= startDate && recordDate <= endDate;
        });
        
        setFilteredRecords(records);
  
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Find today's record
        const todayRecord = records.find(record => {
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          return recordDate === today;
        }) || {};
        
        setAttendanceData({
          employee_id: employee.value,
          name: employee.label,
          intime: todayRecord.intime || '-',
          outtime: todayRecord.outtime || '-',
          overtime: todayRecord.overtime || '0',
          late_in: todayRecord.late_in || 'N'
        });
      } else {
        setFilteredRecords([]);
        setAttendanceData(null);
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
      setFilteredRecords([]);
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (selected) => {
    setSelectedEmployee(selected);
    fetchAttendanceData(selected, dateRange);
  };

  if (!localStorage.getItem('token')) {
    return <Navigate to="/" replace />;
  }

  const adminOnlyPaths = [
    '/admin-dashboard',
    '/logged-in-users',
    '/register',
    '/admin/update-email',
    '/upload-users'
  ];
  const userOnlyPaths = ['/user-dashboard'];

  const isAdminPath = adminOnlyPaths.includes(currentPath);
  const isUserPath = userOnlyPaths.includes(currentPath);

  if ((isAdminPath && userRole !== 'admin') || (isUserPath && userRole !== 'user')) {
    return <Navigate to={userRole === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return (
    <div className="layout-container">
      <Sidebar userRole={userRole} />
      <div className="main-content-wrapper">
        {isDashboardPage && (
          <header className="dashboard-header">
            <div className="filter-container">
              <div className="filter-group">
                <label>Select Employee:</label>
                <Select
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  options={employeeOptions}
                  isLoading={loading}
                  className="employee-select"
                  placeholder="Select employee..."
                />
              </div>
              <div className="date-filters">
                <div className="filter-group">
                  <label>From Date:</label>
                  <input
                    type="date"
                    name="start"
                    value={dateRange.start}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="filter-group">
                  <label>To Date:</label>
                  <input
                    type="date"
                    name="end"
                    value={dateRange.end}
                    onChange={handleDateChange}
                  />
                </div>
              </div>
            </div>

            {loading && <div className="loading-indicator">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            {selectedEmployee && (
              <div className="employee-info">
                <h3>Selected Employee: {selectedEmployee.label}</h3>
              </div>
            )}

            {attendanceData && (
              <div className="attendance-cards">
                <div className="attendance-card">
                  <div className="card-title">Today's Status</div>
                  <div className="card-content">
                    <div className="stat-item">
                      <span className="stat-label">Intime</span>
                      <span className="stat-value">{attendanceData.intime}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Outtime</span>
                      <span className="stat-value">{attendanceData.outtime}</span>
                    </div>
                  </div>
                </div>

                <div className="attendance-card">
                  <div className="card-title">Overtime</div>
                  <div className="card-content">
                    <div className="stat-item">
                      <span className="stat-label">Today</span>
                      <span className="stat-value">{attendanceData.overtime} mins</span>
                    </div>
                  </div>
                </div>

                <div className="attendance-card">
                  <div className="card-title">Late Arrivals</div>
                  <div className="card-content">
                    <div className="stat-item">
                      <span className="stat-label">Today</span>
                      <span className="stat-value">
                        {attendanceData.late_in === 'Y' ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filteredRecords.length > 0 && (
              <div className="attendance-table-container">
                <h3>Attendance Records</h3>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>In Time</th>
                      <th>Out Time</th>
                      <th>Overtime</th>
                      <th>Late In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, index) => (
                      <tr key={index}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.empcode}</td>
                        <td>{record.name}</td>
                        <td>{record.intime || '-'}</td>
                        <td>{record.outtime || '-'}</td>
                        <td>{record.overtime || '0'} mins</td>
                        <td className={record.late_in === 'Y' ? 'late' : ''}>
                          {record.late_in === 'Y' ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </header>
        )}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;