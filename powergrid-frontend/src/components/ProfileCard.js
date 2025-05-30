import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import '../styles/AuthPages.css';

const ProfileCard = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    emp_id: '',
    role: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        setProfileData({
          name: response.data.name || 'N/A',
          email: response.data.email || 'N/A',
          emp_id: response.data.emp_id || 'N/A',
          role: response.data.role || 'N/A',
        });
      }
    } catch (err) {
      setError('Failed to fetch profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-message">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          {profileData.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{profileData.name}</h2>
          <span className="profile-role">
            {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
          </span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-label">Employee ID</div>
          <div className="stat-value">{profileData.emp_id}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Email</div>
          <div className="stat-value">{profileData.email}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 