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
    if (!excelFile) {
      setUploadStatus('Please select a file first');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', excelFile);
    
    try {
      setUploadStatus('Uploading...');
      const response = await axios.post('/auth/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadStatus('File uploaded successfully!');
      setExcelFile(null);
      // Reset file input
      document.getElementById('excel-file').value = '';
    } catch (err) {
      setUploadStatus(err.response?.data?.detail || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <h2>User Management</h2>
      
      <div className="excel-upload-container">
        <h3>Bulk Upload Users</h3>
        <p>Upload an Excel file with user details for bulk registration.</p>
        
        {uploadStatus && (
          <div className={uploadStatus.includes('success') ? 'success-message' : 'error-message'}>
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
            <li>Name (required)</li>
            <li>Email (required)</li>
            <li>Employee ID (required)</li>
            <li>Password (required)</li>
            <li>Role (optional, defaults to "user")</li>
          </ul>
          <a href="/template.xlsx" download className="download-link">Download Template</a>
        </div>
      </div>
    </div>
  );
};

export default UploadUsers;