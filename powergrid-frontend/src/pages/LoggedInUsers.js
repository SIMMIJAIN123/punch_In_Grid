import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

export default function LoggedInUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get a fresh token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('/auth/logged_in_users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Ensure users is always an array
        setUsers(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching logged in users:', err);
        
        if (err.response?.status === 403) {
          setError('You do not have permission to view this page. Please contact your administrator.');
        } else if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          // Optionally redirect to login
          // window.location.href = '/';
        } else {
          setError(err.response?.data?.detail || 'Failed to fetch users. Please try again later.');
        }
        
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading users...</div>;
  
  return (
    <div>
      <h2>Logged In Users</h2>
      
      {error ? (
        <div className="error-message">{error}</div>
      ) : users.length > 0 ? (
        <ul className="users-list">
          {users.map(user => (
            <li key={user.emp_id || user.email || Math.random()}>
              {user.name || 'Unknown'} ({user.email || 'No email'})
            </li>
          ))}
        </ul>
      ) : (
        <p>No users are currently logged in.</p>
      )}
    </div>
  );
}