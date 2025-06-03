import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import moment from 'moment';

const AttendanceCard = ({ user }) => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchTodayAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found', 'error');
                return;
            }

            if (user?.empId) {
                const response = await axios.get(`/service-auth-powerGrid/v1/endpoint/attendance/today/${user.empId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setAttendanceData(response.data);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            if (error.response?.status === 404) {
                setAttendanceData(null);
                return;
            }
            showMessage(error.response?.data?.detail || 'Failed to fetch attendance data', 'error');
        } finally {
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        if (!user || !user.empId) return;
        
        fetchTodayAttendance();
        const interval = setInterval(fetchTodayAttendance, 60000); // Refresh every minute
        
        return () => clearInterval(interval);
    }, [user?.empId]);

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleCheckIn = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found', 'error');
                return;
            }

            const response = await axios.post('/service-auth-powerGrid/v1/endpoint/attendance/check-in', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            showMessage('Check-in successful!', 'success');
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Check-in error:', error);
            showMessage(error.response?.data?.detail || 'Failed to check in', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found', 'error');
                return;
            }

            const response = await axios.post('/service-auth-powerGrid/v1/endpoint/attendance/check-out', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            showMessage('Check-out successful!', 'success');
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Check-out error:', error);
            showMessage(error.response?.data?.detail || 'Failed to check out', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderAttendanceStatus = () => {
        if (isInitialLoad) {
            return (
                <div className="text-center p-4">
                    <h3 className="text-lg font-semibold mb-4">Today's Check In/Out</h3>
                    <p>Loading attendance data...</p>
                </div>
            );
        }

        return (
            <div className="attendance-cards-container">
                <div className="attendance-card today-card">
                    <div className="card-header">
                        <div className="header-content">
                            <div className="card-title">Today's Check In/Out</div>
                        </div>
                    </div>

                    <div className="card-content">
                        <div className="stats-container">
                            <div className="stat-item">
                                <span className="stat-label">Check In:</span>
                                <span className="stat-value">{attendanceData?.intime || 'Not checked in'}</span>
                                <span className="stat-expected">Expected: {attendanceData?.shift_intime || '--:--'}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Check Out:</span>
                                <span className="stat-value">{attendanceData?.outtime || 'Not checked out'}</span>
                                <span className="stat-expected">Expected: {attendanceData?.shift_outtime || '--:--'}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Late In:</span>
                                <span className={`stat-value ${attendanceData?.late_in && attendanceData.late_in !== '0' ? 'text-red-600' : ''}`}>
                                    {attendanceData?.late_in ? `${attendanceData.late_in} mins` : '0 mins'}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Early Out:</span>
                                <span className={`stat-value ${attendanceData?.early_out && attendanceData.early_out !== '0' ? 'text-yellow-600' : ''}`}>
                                    {attendanceData?.early_out ? `${attendanceData.early_out} mins` : '0 mins'}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Overtime:</span>
                                <span className={`stat-value ${attendanceData?.overtime && attendanceData.overtime !== '0' ? 'text-blue-600' : ''}`}>
                                    {attendanceData?.overtime ? `${attendanceData.overtime} mins` : '0 mins'}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Status:</span>
                                <span className={`stat-value ${
                                    attendanceData?.status === 'Present' ? 'text-green-600' :
                                    attendanceData?.status === 'Late' ? 'text-red-600' :
                                    attendanceData?.status === 'Early Out' ? 'text-yellow-600' :
                                    attendanceData?.status === 'Overtime' ? 'text-blue-600' :
                                    'text-gray-600'
                                }`}>
                                    {attendanceData?.status || 'Not Started'}
                                </span>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="button-container">
                            {!attendanceData?.intime ? (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={loading}
                                    className="action-button check-in"
                                >
                                    {loading ? 'Processing...' : 'Check In'}
                                </button>
                            ) : !attendanceData?.outtime ? (
                                <button
                                    onClick={handleCheckOut}
                                    disabled={loading}
                                    className="action-button check-out"
                                >
                                    {loading ? 'Processing...' : 'Check Out'}
                                </button>
                            ) : (
                                <p className="text-green-600 font-medium text-center">Shift Complete</p>
                            )}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .attendance-cards-container {
                        padding: 1rem;
                    }
                    
                    .attendance-card {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }

                    .card-header {
                        padding: 1rem;
                        border-bottom: 1px solid #eee;
                    }

                    .card-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #333;
                    }

                    .card-content {
                        padding: 1rem;
                    }

                    .stats-container {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                        margin-bottom: 1rem;
                    }

                    .stat-item {
                        padding: 0.75rem;
                        background: #f8f9fa;
                        border-radius: 6px;
                        display: flex;
                        flex-direction: column;
                    }

                    .stat-label {
                        color: #666;
                        font-size: 0.9rem;
                        margin-bottom: 0.25rem;
                    }

                    .stat-value {
                        font-size: 1.1rem;
                        font-weight: 500;
                        color: #333;
                    }

                    .stat-expected {
                        font-size: 0.8rem;
                        color: #666;
                        margin-top: 0.25rem;
                    }

                    .button-container {
                        margin-top: 1rem;
                    }

                    .action-button {
                        width: 100%;
                        padding: 0.75rem;
                        border: none;
                        border-radius: 6px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .action-button.check-in {
                        background: #4CAF50;
                        color: white;
                    }

                    .action-button.check-out {
                        background: #f44336;
                        color: white;
                    }

                    .action-button:hover {
                        opacity: 0.9;
                    }

                    .action-button:disabled {
                        background: #ddd;
                        cursor: not-allowed;
                    }

                    .message {
                        padding: 0.75rem;
                        margin: 1rem 0;
                        border-radius: 6px;
                        text-align: center;
                    }

                    .message.success {
                        background: #e8f5e9;
                        color: #2e7d32;
                    }

                    .message.error {
                        background: #ffebee;
                        color: #c62828;
                    }
                `}</style>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {renderAttendanceStatus()}
        </div>
    );
};

export default AttendanceCard; 