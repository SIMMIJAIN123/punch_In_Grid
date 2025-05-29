import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

const CompactProfile = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    emp_id: '',
    role: '',
  });
  const [showDropdown, setShowDropdown] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

  if (loading) {
    return <div className="compact-profile-loading">Loading...</div>;
  }

  if (error) {
    return <div className="compact-profile-error">{error}</div>;
  }

  return (
    <div className="compact-profile">
      <div 
        className="compact-profile-trigger"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="compact-profile-avatar">
          {profileData.name.charAt(0).toUpperCase()}
        </div>
        <div className="compact-profile-info">
          <span className="compact-profile-name">{profileData.name}</span>
          <span className="compact-profile-role">{profileData.role}</span>
        </div>
      </div>

      {showDropdown && (
        <div className="compact-profile-dropdown">
          <div className="dropdown-header">
            <strong>{profileData.name}</strong>
            <span>{profileData.email}</span>
          </div>
          <div className="dropdown-content">
            <div className="dropdown-item">
              <span className="label">Employee ID:</span>
              <span>{profileData.emp_id}</span>
            </div>
            <div className="dropdown-item">
              <span className="label">Role:</span>
              <span>{profileData.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="dropdown-logout">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default CompactProfile; 

