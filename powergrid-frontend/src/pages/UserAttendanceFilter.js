import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { format } from 'date-fns';
import '../styles/AuthPages.css';

export default function UserAttendanceFilter() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return {
      startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
      endDate: format(currentDate, 'yyyy-MM-dd')
    };
  });

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAttendanceData();
    }
  }, [dateRange]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const empId = localStorage.getItem('empId');

      if (!token || !empId) {
        setError('Authentication information not found. Please log in again.');
        return;
      }

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          employee_id: empId
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = response.data?.data || [];
      setAttendanceData(data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err.response?.data?.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prevRange => ({
      ...prevRange,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">My Attendance History</h2>
          
          {/* Date Range Filter */}
          <div className="date-range-filter mb-6">
            <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
            <div className="flex gap-4 items-center">
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
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="date-input"
                />
              </div>
            </div>
          </div>

          {loading && <div className="loading-message">Loading attendance data...</div>}
          {error && <div className="error-message">{error}</div>}

          {/* Attendance Records Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Early Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Out Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work OT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.empcode || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.name || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.shift || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.intime || '--:--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.late_in || '--:--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.early_out || '--:--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.outtime || '--:--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.work_ot || '--:--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.overtime || '--:--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.status || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.remark || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendanceData.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No attendance records found for the selected date range.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 