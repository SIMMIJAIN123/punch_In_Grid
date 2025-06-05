import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UpdateUserEmail from "./pages/UpdateUserEmail";
import ExcelUpload from './pages/admin/ExcelUpload';
import AttendanceFilter from './pages/AttendanceFilter';
import ShiftManagement from './pages/admin/ShiftManagement';

function AppRouter() {
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('role') === 'admin';

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
      />
      
      {/* Admin Routes */}
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
        path="/admin/excel-upload" 
        element={isAuthenticated && isAdmin ? <ExcelUpload /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}

export default AppRouter; 