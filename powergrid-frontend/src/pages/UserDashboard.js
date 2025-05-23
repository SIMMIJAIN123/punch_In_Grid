import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';

export default function UserDashboard() {
  const [userData, setUserData] = useState({
    email: '',
    empId: '',
    role: '',
    isActive: false
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    setUserData({
      email: localStorage.getItem('userEmail'),
      empId: localStorage.getItem('empId'),
      role: localStorage.getItem('role'),
      isActive: localStorage.getItem('isActive') === 'true'
    });
  }, [navigate]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchAttendanceData = async () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          employee_id: userData.empId
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    <div className="user-dashboard">
      <h2>Welcome to User Dashboard</h2>
      
      <div className="profile-section">
        <h3>Profile Information</h3>
        <div className="profile-details">
          <p><strong>Employee ID:</strong> {userData.empId}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Role:</strong> {userData.role}</p>
        </div>
      </div>

      <div className="attendance-filter">
        <h3>View My Attendance</h3>
        <div className="date-filters">
          <div className="input-group">
            <label>From Date:</label>
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
            />
          </div>
          <div className="input-group">
            <label>To Date:</label>
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
            />
          </div>
          <button 
            onClick={fetchAttendanceData}
            disabled={loading || !dateRange.start || !dateRange.end}
          >
            {loading ? 'Loading...' : 'View Attendance'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {attendanceData.length > 0 && (
          <div className="attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In Time</th>
                  <th>Out Time</th>
                  <th>Overtime</th>
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
                    <td>{record.late_in === 'Y' ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
