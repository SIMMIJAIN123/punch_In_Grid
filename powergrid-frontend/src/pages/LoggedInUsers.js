import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

export default function LoggedInUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('/auth/logged_in_users').then(res => {
      setUsers(res.data);
    }).catch(err => alert(err.response?.data?.detail || 'Failed'));
  }, []);

  return (
    <div>
      <h2>Logged In Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.emp_id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}