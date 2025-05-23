import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

const AttendanceStats = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data');
      if (response.data?.hits?.hits) {
        const employeeData = response.data.hits.hits;
        const uniqueEmployees = new Set();
        const employeeOptions = [];

        employeeData.forEach(hit => {
          const employee = hit._source;
          const key = `${employee.empcode}-${employee.name}`;
          
          if (!uniqueEmployees.has(key) && employee.empcode && employee.name) {
            uniqueEmployees.add(key);
            employeeOptions.push({
              value: employee.empcode,
              label: `${employee.name} (${employee.empcode})`
            });
          }
        });

        // Sort by employee name
        employeeOptions.sort((a, b) => a.label.localeCompare(b.label));
        setEmployees(employeeOptions);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employee list');
    }
  };
};

export default AttendanceStats;
