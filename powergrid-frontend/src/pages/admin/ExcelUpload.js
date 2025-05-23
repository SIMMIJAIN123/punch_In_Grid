import React, { useState } from 'react';
import axios from '../../api/axiosConfig';

const ExcelUpload = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
            setFile(selectedFile);
            setMessage('');
        } else {
            setFile(null);
            setMessage('Please select a valid Excel file (.xlsx or .xls)');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/service-auth-powerGrid/v1/endpoint/upload_attendance_excel', formData);
            setMessage(`Success! ${response.data.inserted_count} records uploaded.`);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Upload Attendance Excel</h2>
            <div className="mb-3">
                <input
                    type="file"
                    className="form-control"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={loading}
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || loading}
            >
                {loading ? 'Uploading...' : 'Upload'}
            </button>
            {message && (
                <div className={`alert mt-3 ${message.includes('Success') ? 'alert-success' : 'alert-danger'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default ExcelUpload;