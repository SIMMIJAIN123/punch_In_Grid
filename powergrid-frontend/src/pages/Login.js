import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('/service-auth-powerGrid/v1/endpoint/login', {
        email,
        password
      });
  
      const data = response.data;

      // First store the email for set-password page
      localStorage.setItem('userEmail', email);
      
      // Check if user needs to set password
      if (data.is_active === "false") {
        navigate('/set-password');
        return;
      }
      
      // If user is active, store other data and redirect
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('empId', data.emp_id);
      localStorage.setItem('isActive', data.is_active);
  
      // Redirect based on role
      if (data.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      if (errorMessage.includes('First you need to set your password')) {
        localStorage.setItem('userEmail', email);
        navigate('/set-password');
      } else {
        alert(errorMessage);
      }
    }
  };
  
  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
