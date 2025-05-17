import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // import useNavigate

function SetPasswordForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();  // initialize navigate here

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password set successfully!');
        navigate('/user-dashboard');  // redirect here
      } else {
        setMessage(data.detail || 'Failed to set password.');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Set Password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <button type="submit" style={{ padding: 10, width: '100%' }}>
          Set Password
        </button>
      </form>
      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  );
}

export default SetPasswordForm;
