import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
  // Get user role from localStorage
  const userRole = localStorage.getItem('role');
  const location = useLocation();
  const currentPath = location.pathname;
  
  // If no token exists, redirect to login
  if (!localStorage.getItem('token')) {
    return <Navigate to="/" replace />;
  }
  
  // Define admin-only and user-only paths
  const adminOnlyPaths = [
    '/admin-dashboard', 
    '/logged-in-users', 
    '/register',
    '/admin/update-email',
    '/upload-users',
    '/admin/ShiftManagement',
    '/admin/attendance-filter',
    '/upload-excel',
    '/attendance-stats'
  ];
  const userOnlyPaths = ['/user-dashboard'];
  
  // Check if user has access to current path
  const isAdminPath = adminOnlyPaths.includes(currentPath);
  const isUserPath = userOnlyPaths.includes(currentPath);
  
  // Redirect if user doesn't have access to the current path
  if ((isAdminPath && userRole !== 'admin') || (isUserPath && userRole !== 'user')) {
    return <Navigate to={userRole === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return (
    <div className="layout-container">
      <Sidebar userRole={userRole} />
      <div className="main-content-wrapper">
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;