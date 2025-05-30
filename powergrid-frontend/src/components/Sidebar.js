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
            <Link to="/admin/attendance-filter">Attendance Filter</Link>
            <Link to="/upload-excel">Upload Daily Attendance Excel</Link>
            <Link to="/logged-in-users">Logged In Users</Link>
            <Link to="/upload-users">Upload Users Data</Link>
            <Link to="/admin/update-email" className="admin-link">Update User Email</Link>
          </>
        )}
        
        {/* User-only links */}
        {userRole === 'user' && (
          <Link to="/user/attendance-filter">My Attendance History</Link>
        )}
      </div>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Sidebar;