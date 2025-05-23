import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
  // Get user role from localStorage
  const userRole = localStorage.getItem('role');
  const location = useLocation();
  const currentPath = location.pathname;
  const [punchData, setPunchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  // Check if current path is a dashboard
  const isDashboardPage = currentPath === '/admin-dashboard' || currentPath === '/user-dashboard';
  
  // Month names for the dropdown
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Handle month change
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
    // Here you would fetch data for the selected month
  };

  // If no token exists, redirect to login
  if (!localStorage.getItem('token')) {
    return <Navigate to="/" replace />;
  }
  
  // Define admin-only and user-only paths
  const adminOnlyPaths = [
    '/admin-dashboard', 
    '/logged-in-users', 
    '/register',
    '/admin/update-email',  // Add this path
    '/upload-users'
  ];
  const userOnlyPaths = ['/user-dashboard'];
  
  // Check if user has access to current path
  const isAdminPath = adminOnlyPaths.includes(currentPath);
  const isUserPath = userOnlyPaths.includes(currentPath);
  
  // Redirect if user doesn't have access to the current path
  if ((isAdminPath && userRole !== 'admin') || (isUserPath && userRole !== 'user')) {
    return <Navigate to={userRole === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  // Function to handle punch in/out
  const handlePunch = () => {
    // This would be implemented when the backend endpoint is available
    alert('Punch functionality will be available soon!');
  };

  return (
    <div className="layout-container">
      <Sidebar userRole={userRole} />
      <div className="main-content-wrapper">
        {/* Only show punch data header on dashboard pages */}
        {isDashboardPage && (
          <header className="dashboard-header">
            <div className="month-selector-container">
              <h3 className="dashboard-title">Attendance Overview</h3>
              <div className="month-selector">
                <label htmlFor="month-select">View data for:</label>
                <select 
                  id="month-select" 
                  value={selectedMonth}
                  onChange={handleMonthChange}
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>
                      {month} {new Date().getFullYear()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="attendance-cards">
             
              
              <div className="attendance-card">
                <div className="card-title">Today's Status</div>
                <div className="card-content">
                  <div className="stat-item">
                    <span className="stat-label">Intime</span>
                    <span className="stat-value"></span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Outtime</span>
                    <span className="stat-value"></span>
                  </div>
                </div>
              </div>
              
              <div className="attendance-card">
                <div className="card-title">Overtime</div>
                <div className="card-content">
                  <div className="stat-item">
                    <span className="stat-label">Total</span>
                    <span className="stat-value"></span>
                  </div>
                </div>
              </div>
              
              <div className="attendance-card">
                <div className="card-title">Late Arrivals</div>
                <div className="card-content">
                  <div className="stat-item">
                    <span className="stat-label">Total</span>
                    <span className="stat-value"></span>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Make sure the export is correct
export default Layout;