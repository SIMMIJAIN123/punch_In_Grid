import React, { useState } from 'react';

export default function AdminDashboard() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file before uploading.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No auth token found. Please login again.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/auth/upload_excel', {
        method: 'POST',
        headers: {
          // Do NOT set 'Content-Type' header when sending FormData
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Upload successful! Inserted count: ${data.inserted_count}`);
        setError('');
      } else {
        setError(data.detail || 'Upload failed');
        setMessage('');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Something went wrong during upload.');
      setMessage('');
    }
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          required
        />
        <button type="submit">Upload Excel</button>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
