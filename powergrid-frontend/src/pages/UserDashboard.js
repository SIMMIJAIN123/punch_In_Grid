import React, { useEffect, useState } from 'react';

export default function UserDashboard() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Get username from localStorage (or wherever you store it)
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <div className="container">
      <h2>Welcome to User Dashboard</h2>
      {username && <p>Hello, {username}!</p>}
      <p>Your punch and shift details will appear here.</p>
    </div>
  );
}
