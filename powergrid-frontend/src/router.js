import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UpdateUserEmail from "./pages/UpdateUserEmail";
// Replace the PdfUpload route with ExcelUpload
import ExcelUpload from './pages/admin/ExcelUpload';

// Inside your router configuration, update the route:
{
  path: '/admin/excel-upload',
  element: <ProtectedRoute><ExcelUpload /></ProtectedRoute>
}
import AttendanceFilter from './pages/AttendanceFilter';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/update-email" element={<UpdateUserEmail />} />
        {/* {
          path: '/admin/attendance-filter',
          element: <ProtectedRoute><AttendanceFilter /></ProtectedRoute>
        } */}
      </Routes>
    </Router>
  );
}

export default AppRouter;
