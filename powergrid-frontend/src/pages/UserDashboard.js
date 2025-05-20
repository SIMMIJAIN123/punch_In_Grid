import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const [userData, setUserData] = useState({
    email: '',
    empId: '',
    role: '',
    isActive: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    // Get user data from localStorage
    setUserData({
      email: localStorage.getItem('userEmail'),
      empId: localStorage.getItem('empId'),
      role: localStorage.getItem('role'),
      isActive: localStorage.getItem('isActive') === 'true'
    });
  }, [navigate]);

  return (
    <div className="user-dashboard">
      <h2>Welcome to User Dashboard</h2>
      
      <div className="profile-section">
        <h3>Profile Information</h3>
        <div className="profile-details">
          <p><strong>Employee ID:</strong> {userData.empId}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Role:</strong> {userData.role}</p>
          <p><strong>Status:</strong> {userData.isActive ? 'Active' : 'Inactive'}</p>
        </div>
      </div>
    </div>
  );
}
