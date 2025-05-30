import React, { useState } from 'react';
import axios from '../api/axiosConfig';
import '../styles/Register.css';

const UploadUsers = () => {
  const [excelFile, setExcelFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const handleFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };
  
  const handleFileUpload = async (e) => {
    e.preventDefault();
    try {
      if (!excelFile) {
        throw new Error('Please select a file first');
      }
  
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found. Please login again.');
      }
  
      // Validate file type
      if (!excelFile.name.match(/\.(xlsx|xls)$/)) {
        throw new Error('Please upload a valid Excel file (.xlsx or .xls)');
      }
  
      setUploadStatus('Uploading...');
      const formData = new FormData();
      formData.append('file', excelFile);
  
      const response = await axios.post('/service-auth-powerGrid/v1/endpoint/upload_excel', formData);
      setUploadStatus(`Upload successful! Inserted count: ${response.data.inserted_count}`);
      setExcelFile(null);
      document.getElementById('excel-file').value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus(err.response?.data?.detail || err.message || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <h2>User Management</h2>
      
      <div className="excel-upload-container">
        <h3>Bulk Upload Users</h3>
        <p>Upload an Excel file with user details for bulk registration.</p>
        
        {uploadStatus && (
          <div className={uploadStatus.includes('successful') ? 'success-message' : 'error-message'}>
            {uploadStatus}
          </div>
        )}
        
        <form onSubmit={handleFileUpload} className="upload-form">
          <div className="form-group">
            <label htmlFor="excel-file">Select Excel File</label>
            <input
              type="file"
              id="excel-file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              required
            />
          </div>
          
          <button type="submit" className="upload-btn">Upload File</button>
        </form>
        
        <div className="template-download">
          <h4>Excel Template Format</h4>
          <p>Your Excel file should have the following columns:</p>
          <ul>
            <li>emp_id (required)</li>
            <li>name (required)</li>
            <li>email (required)</li>
            <li>password (empty)</li>
            <li>is_active (false)</li>
            <li>role (user)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadUsers;