import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

export default function UserDashboard() {
  const [userData, setUserData] = useState({
    name: 'User',
    email: ''
  });
  const [loading, setLoading] = useState(false); // Changed to false since we're not fetching initially
  const [error, setError] = useState('');

  // Commented out the fetch since the endpoint doesn't exist yet
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const token = localStorage.getItem('token');
  //       const response = await axios.get('/auth/user-data', {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       });
  //       
  //       setUserData(response.data);
  //       setLoading(false);
  //     } catch (err) {
  //       console.error('Error fetching user data:', err);
  //       setError('Failed to load your data. Please try again later.');
  //       setLoading(false);
  //     }
  //   };
  //
  //   fetchUserData();
  // }, []);

  // if (loading) return <div>Loading your dashboard...</div>;
  // if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="user-dashboard">
      <h2>Welcome to Your Dashboard</h2>
      <div className="dashboard-content">
        <p>Your user dashboard is under construction.</p>
        <p>Soon you'll be able to view your attendance records and other information here.</p>
      </div>
    </div>
  );
}
