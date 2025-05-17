import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ userRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>PowerGrid</h3>
      </div>
      
      <div className="sidebar-menu">
        {/* Common links for all users */}
        <Link to={userRole === 'admin' ? '/admin-dashboard' : '/user-dashboard'}>Dashboard</Link>
        
        {/* Admin-only links */}
        {userRole === 'admin' && (
          <>
            <Link to="/logged-in-users">Logged In Users</Link>
            <Link to="/register">Register User</Link>
            <Link to="/upload-users">Upload Users Data</Link>
          </>
        )}
        
        {/* User-only links */}
        {userRole === 'user' && (
          <>
            <Link to="/user-profile">My Profile</Link>
            {/* Add more user-specific links as needed */}
          </>
        )}
      </div>
      
      {/* Improved logout button placement and styling */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
};

export default Sidebar;