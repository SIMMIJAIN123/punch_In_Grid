import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import SetPassword from './pages/SetPassword';
import AttendanceStats from './pages/AttendanceStats';
import UploadExcel from './pages/UploadExcel';
import LoggedInUsers from './pages/LoggedInUsers';
import Layout from './components/Layout';
import './App.css';
import UploadUsers from './pages/UploadUsers';
import UpdateUserEmail from './pages/UpdateUserEmail';
import AttendanceFilter from './pages/AttendanceFilter';
import UserAttendanceFilter from './pages/UserAttendanceFilter';
import ShiftManagement from './pages/admin/ShiftManagement';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes with Layout */}
        <Route element={<Layout />}>
          {/* Admin routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/attendance-stats" element={<AttendanceStats />} />
          <Route path="/upload-excel" element={<UploadExcel />} />
          <Route path="/logged-in-users" element={<LoggedInUsers />} />
          <Route path="/admin/update-email" element={<UpdateUserEmail />} />
          <Route path="/upload-users" element={<UploadUsers />} />
          <Route path="/admin/attendance-filter" element={<AttendanceFilter />} />
          <Route path="/admin/ShiftManagement" element={<ShiftManagement />} />
          
          {/* User routes */}
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/user/attendance-filter" element={<UserAttendanceFilter />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;