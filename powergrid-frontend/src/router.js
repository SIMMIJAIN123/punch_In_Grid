import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UpdateUserEmail from "./pages/UpdateUserEmail";
// Replace the PdfUpload route with ExcelUpload
import ExcelUpload from './pages/admin/ExcelUpload';

// Inside your router configuration, update the route:
// {
//   path: '/admin/excel-upload',
//   element: <ProtectedRoute><ExcelUpload /></ProtectedRoute>
// }
import AttendanceFilter from './pages/AttendanceFilter';
import ShiftManagement from './pages/admin/ShiftManagement';

function AppRouter() {
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('role') === 'admin';

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
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
    </Router>
  );
}

export default AppRouter;
