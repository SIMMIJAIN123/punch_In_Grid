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
    return <Navigate to="/login" replace />;
  }
  
  // Define admin-only and user-only paths
  const adminOnlyPaths = [
    '/admin-dashboard',
    '/logged-in-users',
    '/upload-users',
    '/admin/update-email',
    '/admin/ShiftManagement',
    '/admin/attendance-filter',
    '/upload-excel'
  ];
  const userOnlyPaths = ['/user-dashboard', '/user/attendance-filter'];
  
  // Check if user has access to current path
  const isAdminPath = adminOnlyPaths.some(path => currentPath.startsWith(path));
  const isUserPath = userOnlyPaths.some(path => currentPath.startsWith(path));
  
  // Redirect if user doesn't have access to the current path
  if ((isAdminPath && userRole !== 'admin') || (isUserPath && userRole === 'admin')) {
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