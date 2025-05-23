import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import Select from 'react-select';
import './AttendanceFilter.css';

const AttendanceFilter = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);

  useEffect(() => {
    fetchEmployeeNames();
  }, []);

  const fetchEmployeeNames = async () => {
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
      setError('Failed to fetch employees: ' + (err.response?.data?.message || err.message));
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

  const handleEmployeeChange = (selected) => {
    setSelectedEmployees(selected || []);
  };

  const fetchAttendanceData = async () => {
    if (!dateRange.start || !dateRange.end || selectedEmployees.length === 0) {
      setError('Please select both date range and employees');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const employeeIds = selectedEmployees.map(emp => emp.value);
      
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          employee_ids: employeeIds.join(',')
        }
      });

      setAttendanceData(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch attendance data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-container">
      <div className="filter-section">
        <div className="date-filters">
          <div className="input-group">
            <label>From Date</label>
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
            />
          </div>
          <div className="input-group">
            <label>To Date</label>
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
            />
          </div>
        </div>

        <div className="employee-filter">
          <label>Select Employees</label>
          <Select
            isMulti
            options={employeeOptions}
            value={selectedEmployees}
            onChange={handleEmployeeChange}
            className="employee-select"
            placeholder="Select employees..."
            isLoading={loading}
          />
        </div>

        <button 
          onClick={fetchAttendanceData} 
          disabled={loading || !dateRange.start || !dateRange.end || selectedEmployees.length === 0}
          className="fetch-button"
        >
          {loading ? 'Loading...' : 'Fetch Records'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {attendanceData.length > 0 && (
        <div className="records-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Overtime (min)</th>
                <th>Late Arrival</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.intime || '-'}</td>
                  <td>{record.outtime || '-'}</td>
                  <td>{record.overtime || '0'}</td>
                  <td className={record.late_in === 'Y' ? 'late' : ''}>
                    {record.late_in === 'Y' ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceFilter;