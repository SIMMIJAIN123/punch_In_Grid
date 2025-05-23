// import React, { useState, useEffect } from 'react';
// import axios from '../api/axiosConfig';
// import Select from 'react-select';

// const AttendanceFilter = () => {
//   const [dateRange, setDateRange] = useState({ start: '', end: '' });
//   const [selectedEmpIds, setSelectedEmpIds] = useState([]); 
//   const [attendanceData, setAttendanceData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [employeeOptions, setEmployeeOptions] = useState([]);

//   useEffect(() => {
//     const role = localStorage.getItem('role');
//     if (role !== 'admin') {
//       setError('Only admin users can access this page');
//       return;
//     }
//     fetchEmployeeNames();
//   }, []);

//   const fetchEmployeeNames = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data');

//       if (response.data && Array.isArray(response.data.data)) {
//         const uniqueEmpCodes = new Set();
//         const options = [];

//         response.data.data.forEach(record => {
//           if (!uniqueEmpCodes.has(record.empcode) && record.empcode) {
//             uniqueEmpCodes.add(record.empcode);
//             options.push({
//               value: record.empcode,
//               label: record.name
//             });
//           }
//         });

//         setEmployeeOptions(options);
//       }
//     } catch (err) {
//       setError('Failed to fetch employees: ' + (err.response?.data?.detail || err.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDateChange = (e) => {
//     const { name, value } = e.target;
//     setDateRange(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // changed to handle multiple selection
//   const handleNameChange = (selected) => {
//     // selected is an array of selected options or null
//     setSelectedEmpIds(selected ? selected.map(option => option.value) : []);
//   };

//   const fetchAttendanceData = async () => {
//     if (!dateRange.start && !dateRange.end && selectedEmpIds.length === 0) {
//       setError('Please select at least one filter (date range or employee)');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');

//       const token = localStorage.getItem('token');
//       if (!token) {
//         setError('Authentication token not found');
//         return;
//       }

//       // Prepare params - send empcode as comma-separated string or array based on backend expectation
//       // Here sending as comma-separated string, adjust if your API accepts array format
//       const params = {
//         start_date: dateRange.start || undefined,
//         end_date: dateRange.end || undefined,
//       };
//       if (selectedEmpIds.length > 0) {
//         params.empcode = selectedEmpIds.join(',');
//       }

//       const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
//         params,
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       if (response.data && response.data.data) {
//         setAttendanceData(response.data.data);
//       } else {
//         setAttendanceData([]);
//         setError('No attendance records found');
//       }
//     } catch (err) {
//       if (err.response?.status === 403) {
//         setError('Not authorized. Only admin users can access this feature.');
//       } else {
//         setError('Failed to fetch attendance data: ' + (err.response?.data?.detail || err.message));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="attendance-container">
//       <div className="filter-section">
//         <div className="date-filters">
//           <div className="input-group">
//             <label>From Date</label>
//             <input
//               type="date"
//               name="start"
//               value={dateRange.start}
//               onChange={handleDateChange}
//             />
//           </div>
//           <div className="input-group">
//             <label>To Date</label>
//             <input
//               type="date"
//               name="end"
//               value={dateRange.end}
//               onChange={handleDateChange}
//             />
//           </div>
//         </div>

//         <div className="employee-filter">
//           <label>Select Employee(s)</label>
//           <Select
//             isClearable
//             isMulti  // enable multi select
//             options={employeeOptions}
//             value={employeeOptions.filter(option => selectedEmpIds.includes(option.value))}
//             onChange={handleNameChange}
//             className="employee-select"
//             placeholder="Select employee(s)..."
//             isLoading={loading}
//           />
//         </div>

//         <button
//           onClick={fetchAttendanceData}
//           disabled={loading}
//           className="fetch-button"
//         >
//           {loading ? 'Loading...' : 'Fetch Records'}
//         </button>
//       </div>

//       {error && <div className="error-message">{error}</div>}

//       {attendanceData.length > 0 && (
//         <div className="records-table">
//           <table>
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Employee Code</th>
//                 <th>Name</th>
//                 <th>Shift</th>
//                 <th>In Time</th>
//                 <th>Late In</th>
//                 <th>Early Out</th>
//                 <th>Out Time</th>
//                 <th>Work OT</th>
//                 <th>Overtime</th>
//                 <th>Status</th>
//                 <th>Remark</th>
//               </tr>
//             </thead>
//             <tbody>
//               {attendanceData.map((record, index) => (
//                 <tr key={index}>
//                   <td>{new Date(record.date + "T00:00:00").toLocaleDateString()}</td>
//                   <td>{record.empcode}</td>
//                   <td>{record.name}</td>
//                   <td>{record.shift || '-'}</td>
//                   <td>{record.intime || '-'}</td>
//                   <td>{record.late_in || '-'}</td>
//                   <td>{record.early_out || '-'}</td>
//                   <td>{record.outtime || '-'}</td>
//                   <td>{record.work_ot || '-'}</td>
//                   <td>{record.overtime || '-'}</td>
//                   <td>{record.status || '-'}</td>
//                   <td>{record.remark || '-'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AttendanceFilter;

import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import Select from 'react-select';

const AttendanceFilter = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedEmpIds, setSelectedEmpIds] = useState([]); 
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      setError('Only admin users can access this page');
      return;
    }
    fetchEmployeeNames();
  }, []);

  const fetchEmployeeNames = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data');

      if (response.data && Array.isArray(response.data.data)) {
        const uniqueEmpCodes = new Set();
        const options = [];

        response.data.data.forEach(record => {
          if (!uniqueEmpCodes.has(record.empcode) && record.empcode) {
            uniqueEmpCodes.add(record.empcode);
            options.push({
              value: record.empcode,
              label: record.name
            });
          }
        });

        setEmployeeOptions(options);
      }
    } catch (err) {
      setError('Failed to fetch employees: ' + (err.response?.data?.detail || err.message));
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

  const handleNameChange = (selected) => {
    setSelectedEmpIds(selected ? selected.map(option => option.value) : []);
  };

  const fetchAttendanceData = async () => {
    if (!dateRange.start && !dateRange.end && selectedEmpIds.length === 0) {
      setError('Please select at least one filter (date range or employee)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      const params = {};
      if (dateRange.start) params.start_date = dateRange.start;
      if (dateRange.end) params.end_date = dateRange.end;
      if (selectedEmpIds.length > 0) params.empcode = selectedEmpIds.join(',');

      console.log('Fetching attendance with params:', params);

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.data) {
        // Fallback frontend filtering in case backend doesn't filter by empcode properly
        const filteredData = selectedEmpIds.length > 0
          ? response.data.data.filter(record => selectedEmpIds.includes(record.empcode))
          : response.data.data;

        setAttendanceData(filteredData);
      } else {
        setAttendanceData([]);
        setError('No attendance records found');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Not authorized. Only admin users can access this feature.');
      } else {
        setError('Failed to fetch attendance data: ' + (err.response?.data?.detail || err.message));
      }
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
          <label>Select Employee(s)</label>
          <Select
            isClearable
            isMulti
            options={employeeOptions}
            value={employeeOptions.filter(option => selectedEmpIds.includes(option.value))}
            onChange={handleNameChange}
            className="employee-select"
            placeholder="Select employee(s)..."
            isLoading={loading}
          />
        </div>

        <button
          onClick={fetchAttendanceData}
          disabled={loading}
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
                <th>Employee Code</th>
                <th>Name</th>
                <th>Shift</th>
                <th>In Time</th>
                <th>Late In</th>
                <th>Early Out</th>
                <th>Out Time</th>
                <th>Work OT</th>
                <th>Overtime</th>
                <th>Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.date + "T00:00:00").toLocaleDateString()}</td>
                  <td>{record.empcode}</td>
                  <td>{record.name}</td>
                  <td>{record.shift || '-'}</td>
                  <td>{record.intime || '-'}</td>
                  <td>{record.late_in || '-'}</td>
                  <td>{record.early_out || '-'}</td>
                  <td>{record.outtime || '-'}</td>
                  <td>{record.work_ot || '-'}</td>
                  <td>{record.overtime || '-'}</td>
                  <td>{record.status || '-'}</td>
                  <td>{record.remark || '-'}</td>
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
