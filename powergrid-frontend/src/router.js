import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UpdateUserEmail from "./pages/UpdateUserEmail";
import ExcelUpload from './pages/admin/ExcelUpload';
import AttendanceFilter from './pages/AttendanceFilter';
import ShiftManagement from './pages/admin/ShiftManagement';
import Layout from './components/Layout';
import LoggedInUsers from './pages/LoggedInUsers';
import UploadUsers from './pages/UploadUsers';

function AppRouter() {
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('role') === 'admin';

  // Redirect authenticated users from login page
  if (isAuthenticated && window.location.pathname === '/login') {
    return <Navigate to={isAdmin ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to={isAdmin ? '/admin-dashboard' : '/user-dashboard'} /> : <Login />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={isAdmin ? '/admin-dashboard' : '/user-dashboard'} /> : <Login />} />
      
      {/* Protected routes with Layout */}
      <Route element={<Layout />}>
        {/* Admin routes */}
        <Route 
          path="/admin-dashboard" 
          element={isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/update-email" 
          element={isAuthenticated && isAdmin ? <UpdateUserEmail /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/ShiftManagement" 
          element={isAuthenticated && isAdmin ? <ShiftManagement /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/attendance-filter" 
          element={isAuthenticated && isAdmin ? <AttendanceFilter /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/upload-excel" 
          element={isAuthenticated && isAdmin ? <ExcelUpload /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/logged-in-users" 
          element={isAuthenticated && isAdmin ? <LoggedInUsers /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/upload-users" 
          element={isAuthenticated && isAdmin ? <UploadUsers /> : <Navigate to="/login" />} 
        />

        {/* User routes */}
        <Route 
          path="/user-dashboard" 
          element={isAuthenticated ? <UserDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/user/attendance-filter" 
          element={isAuthenticated ? <AttendanceFilter /> : <Navigate to="/login" />} 
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default AppRouter;
