import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

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
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {profileData.name.charAt(0).toUpperCase()}
        </div>
        <h3 className="profile-name">{profileData.name}</h3>
        <span className="profile-role">{profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}</span>
      </div>
      <div className="profile-details">
        <div className="profile-info-item">
          <span className="info-label">Employee ID</span>
          <span className="info-value">{profileData.emp_id}</span>
        </div>
        <div className="profile-info-item">
          <span className="info-label">Email</span>
          <span className="info-value">{profileData.email}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 