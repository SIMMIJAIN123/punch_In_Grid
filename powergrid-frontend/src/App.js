import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import SetPassword from './pages/SetPassword';
import UploadExcel from './pages/UploadExcel';
import LoggedInUsers from './pages/LoggedInUsers';
// Make sure this path is correct - adjust if your Layout component is in a different location
import Layout from './components/Layout'; 
import './App.css';

// Add this import
import UploadUsers from './pages/UploadUsers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes with Layout */}
        <Route element={<Layout />}>
          {/* Admin routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/upload-excel" element={<UploadExcel />} />
          <Route path="/logged-in-users" element={<LoggedInUsers />} />
          
          {/* User routes */}
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
        // Then in your Routes section, add:
        <Route path="/upload-users" element={<UploadUsers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;