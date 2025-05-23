import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axiosConfig';

export default function UpdateUserEmail() {
  const [empId, setEmpId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('/service-auth-powerGrid/v1/endpoint/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.role !== 'admin') {
          navigate('/dashboard');
        }
      } catch (err) {
        navigate('/login');
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/admin/users/${empId}/email`, {
        new_email: newEmail
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage(response.data.message);
      setError('');
      setEmpId('');
      setNewEmail('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update email');
      setMessage('');
    }
  };

  return (
    <div className="admin-container">
      <h2>Update User Email</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label htmlFor="empId">Employee ID:</label>
          <input
            type="text"
            id="empId"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="newEmail">New Email:</label>
          <input
            type="email"
            id="newEmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="admin-button">Update Email</button>
      </form>
    </div>
  );
}