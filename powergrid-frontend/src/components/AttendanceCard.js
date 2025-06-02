import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import moment from 'moment';

const AttendanceCard = ({ user }) => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [selectedMonth, setSelectedMonth] = useState(moment().format('MM'));
    const [selectedYear, setSelectedYear] = useState(moment().format('YYYY'));

    const fetchTodayAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found', 'error');
                return;
            }

            console.log('Fetching attendance for user:', user);
            const response = await axios.get(`/api/attendance/today/${user.empId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Today attendance data received:', response.data);
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error.response || error);
            if (error.response?.status === 404) {
                // If no attendance found, that's okay - just set to null
                setAttendanceData(null);
                return;
            }
            showMessage(error.response?.data?.message || 'Failed to fetch attendance data', 'error');
        }
    };

    const fetchMonthlyData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const startDate = moment(`${selectedYear}-${selectedMonth}-01`).startOf('month').format('YYYY-MM-DD');
            const endDate = moment(`${selectedYear}-${selectedMonth}-01`).endOf('month').format('YYYY-MM-DD');
            
            const response = await axios.get('/service-auth-powerGrid/v1/endpoint/attendance_data/filter', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    employee_id: user.empId
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setMonthlyData(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching monthly data:', error);
        }
    };

    useEffect(() => {
        if (user?.empId) {
            fetchTodayAttendance();
            fetchMonthlyData();
            const interval = setInterval(fetchTodayAttendance, 60000);
            return () => clearInterval(interval);
        } else {
            console.warn('No user ID available:', user);
        }
    }, [user?.empId, selectedMonth, selectedYear]);

    const showMessage = (text, type) => {
        console.log(`Showing message: ${text} (${type})`);
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleCheckIn = async () => {
        try {
            setLoading(true);
            console.log('Attempting check-in for user:', user);

            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found', 'error');
                return;
            }

            // Check if already checked in
            if (attendanceData?.intime) {
                showMessage('Already checked in for today', 'error');
                return;
            }

            // First, ensure shift exists
            try {
                await axios.post('/api/attendance/shifts', {
                    shift_name: "4",
                    shift_intime: "5:30 PM",
                    shift_outtime: "2:30 AM"
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('Error creating shift:', error);
                // Continue anyway as the shift might already exist
            }

            const response = await axios.post('/api/attendance/check-in', {
                emp_id: user.empId,
                name: user.name,
                shift: user.shift || '4'  // Default to shift 4 if not specified
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Check-in response:', response.data);
            showMessage('Check-in successful!', 'success');
            fetchTodayAttendance();
            fetchMonthlyData();
        } catch (error) {
            console.error('Check-in error:', error.response || error);
            showMessage(error.response?.data?.detail || error.response?.data?.message || 'Failed to check in', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setLoading(true);
            console.log('Attempting check-out for user:', user);

            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found', 'error');
                return;
            }

            // Check if not checked in or already checked out
            if (!attendanceData?.intime) {
                showMessage('Must check in first', 'error');
                return;
            }
            if (attendanceData?.outtime) {
                showMessage('Already checked out for today', 'error');
                return;
            }

            const response = await axios.post('/api/attendance/check-out', {
                emp_id: user.empId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Check-out response:', response.data);
            showMessage('Check-out successful!', 'success');
            fetchTodayAttendance();
            fetchMonthlyData();
        } catch (error) {
            console.error('Check-out error:', error.response || error);
            showMessage(error.response?.data?.detail || error.response?.data?.message || 'Failed to check out', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Calculate monthly statistics
    const calculateMonthlyStats = () => {
        if (!monthlyData.length) return {
            totalDays: 0,
            presentDays: 0,
            lateIns: 0,
            earlyOuts: 0,
            overtime: 0
        };

        return monthlyData.reduce((stats, record) => {
            stats.totalDays++;
            if (record.status === 'Present') stats.presentDays++;
            if (record.late_in) stats.lateIns++;
            if (record.early_out) stats.earlyOuts++;
            if (record.overtime) stats.overtime += parseInt(record.overtime);
            return stats;
        }, {
            totalDays: 0,
            presentDays: 0,
            lateIns: 0,
            earlyOuts: 0,
            overtime: 0
        });
    };

    const monthlyStats = calculateMonthlyStats();

    // Get array of months
    const months = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    // Get array of years (last 5 years to current year)
    const getYearOptions = () => {
        const years = [];
        const currentYear = moment().year();
        for (let i = 0; i < 5; i++) {
            const year = currentYear - i;
            years.push({ value: year.toString(), label: year.toString() });
        }
        return years;
    };

    return (
        <div className="attendance-cards-container">
            <div className="attendance-card today-card">
                <div className="card-header">
                    <div className="header-content">
                        <div className="card-title">Today's Check In/Out</div>
                        <div className="date-selectors">
                            <select 
                                className="date-selector"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                {months.map(month => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                            <select 
                                className="date-selector"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {getYearOptions().map(year => (
                                    <option key={year.value} value={year.value}>
                                        {year.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="card-content">
                    <div className="time-section">
                        <div className="time-item">
                            <div className="time-label">Check In</div>
                            <div className="time-value">{attendanceData?.intime || '--:--'}</div>
                        </div>
                        <div className="time-item">
                            <div className="time-label">Check Out</div>
                            <div className="time-value">{attendanceData?.outtime || '--:--'}</div>
                        </div>
                    </div>

                    <div className="button-container">
                        <button
                            className={`action-button ${attendanceData?.intime ? 'disabled' : ''}`}
                            onClick={handleCheckIn}
                            disabled={loading || attendanceData?.intime}
                        >
                            {loading ? 'Processing...' : 'Check In'}
                        </button>
                        <button
                            className={`action-button ${!attendanceData?.intime || attendanceData?.outtime ? 'disabled' : ''}`}
                            onClick={handleCheckOut}
                            disabled={loading || !attendanceData?.intime || attendanceData?.outtime}
                        >
                            {loading ? 'Processing...' : 'Check Out'}
                        </button>
                    </div>

                    {message.text && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="stats-container">
                        <div className="stat-item">
                            <span className="stat-label">Late In:</span>
                            <span className="stat-value">{attendanceData?.late_in ? `${attendanceData.late_in} mins` : '--'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Early Out:</span>
                            <span className="stat-value">{attendanceData?.early_out ? `${attendanceData.early_out} mins` : '--'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Overtime:</span>
                            <span className="stat-value">{attendanceData?.overtime ? `${attendanceData.overtime} mins` : '--'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Status:</span>
                            <span className="stat-value">{attendanceData?.status || 'Not Started'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Statistics Card */}
            {/* <div className="attendance-card monthly-card">
                <div className="card-title">This Month's Statistics</div>
                <div className="card-content">
                    <div className="stat-item">
                        <span className="stat-label">Total Working Days</span>
                        <span className="stat-value">{monthlyStats.totalDays}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Present Days</span>
                        <span className="stat-value">{monthlyStats.presentDays}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Late Ins</span>
                        <span className="stat-value">{monthlyStats.lateIns}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Early Outs</span>
                        <span className="stat-value">{monthlyStats.earlyOuts}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Total Overtime</span>
                        <span className="stat-value">{monthlyStats.overtime} mins</span>
                    </div>
                </div>
            </div> */}

            <style jsx>{`
                .attendance-cards-container {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    padding: 1rem;
                }
                
                .attendance-card {
                    flex: 1;
                    min-width: 300px;
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

                .time-section {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 1rem;
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .time-item {
                    text-align: center;
                }

                .time-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 0.25rem;
                }

                .time-value {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #333;
                }

                .button-container {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .action-button {
                    flex: 1;
                    padding: 0.5rem;
                    border: none;
                    border-radius: 4px;
                    font-weight: 500;
                    background: #4CAF50;
                    color: white;
                    cursor: pointer;
                }

                .action-button:disabled {
                    background: #ddd;
                    cursor: not-allowed;
                }

                .message {
                    padding: 0.5rem;
                    margin-bottom: 1rem;
                    border-radius: 4px;
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

                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                }

                .stat-item {
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .stat-label {
                    color: #666;
                    margin-right: 0.5rem;
                }

                .stat-value {
                    color: #333;
                    font-weight: 500;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .date-selectors {
                    display: flex;
                    gap: 0.5rem;
                }

                .date-selector {
                    padding: 0.3rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background-color: white;
                    font-size: 0.9rem;
                    color: #333;
                    cursor: pointer;
                }

                .date-selector:focus {
                    outline: none;
                    border-color: #4CAF50;
                }

                .date-selector:hover {
                    border-color: #999;
                }
            `}</style>
        </div>
    );
};

export default AttendanceCard; 