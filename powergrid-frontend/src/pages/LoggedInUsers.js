import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

export default function LoggedInUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await axios.get('/service-auth-powerGrid/v1/endpoint/logged_in_users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // ✅ Access the 'data' field inside response.data
        const usersList = response.data?.data || [];
        setUsers(usersList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching logged in users:', err);

        if (err.response?.status === 403) {
          setError('You do not have permission to view this page. You must be an admin.');
        } else if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
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
          {users.map((user) => (
            <li key={user.emp_id || user.email}>
              {user.name || 'Unknown'} ({user.email || 'No email'}) - {user.role}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users are currently logged in.</p>
      )}
    </div>
  );
}
