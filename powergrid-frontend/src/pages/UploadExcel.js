import { useState } from 'react';
import axios from '../api/axiosConfig';
import React from 'react';


export default function UploadExcel() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post('/service-auth-powerGrid/v1/endpoint/upload_attendance_excel', formData);
      setMessage('Excel uploaded successfully');
      setFile(null);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed');
    }
  };

  return (
    <div>
      <h2>Upload Attendance Excel</h2>
      <div>
        <input 
          type="file" 
          accept=".xlsx,.xls"
          onChange={e => {
            setFile(e.target.files[0]);
            setMessage('');
          }} 
        />
      </div>
      {message && <p>{message}</p>}
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}