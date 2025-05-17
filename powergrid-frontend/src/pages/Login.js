import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const response = await fetch('http://localhost:8000/auth/login', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email, password }),
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       // Save token and role
  //       localStorage.setItem('token', data.access_token);
  //       localStorage.setItem('role', data.role);

  //       // Redirect based on role and password status
  //       if (data.role === 'admin') {
  //         navigate('/admin-dashboard');
  //       } else if (data.role === 'user') {
  //         if (data.password_set === false) {
  //           navigate('/set-password');
  //           window.location.href = "/set-password/";
  //         } else {
  //           navigate('/user-dashboard');
  //         }
  //       } else {
  //         alert('Unknown role, cannot redirect');
  //       }
  //     } else {
  //       alert(data.detail || 'Login failed');
  //     }
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     alert('Something went wrong. Please try again.');
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Save token and role
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
  
        // Redirect based on role and password status
        if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.role === 'user') {
          if (data.password_set === false) {
            navigate('/set-password'); // this is enough
          } else {
            navigate('/user-dashboard');
          }
        } else {
          alert('Unknown role, cannot redirect');
        }
      } else {
        // 🔥 Catch specific error from backend
        if (data.detail === 'First you need to set your password') {
          navigate('/set-password');
        } else {
          alert(data.detail || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong. Please try again.');
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

      <p>
        Don't have an account?{' '}
        <button type="button" onClick={() => navigate('/register')}>
          Register here
        </button>
      </p>
    </div>
  );
}
