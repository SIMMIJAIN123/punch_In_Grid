// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from '../api/axiosConfig'; // Make sure this path is correct

// export default function Register() {
//   const [form, setForm] = useState({
//     emp_id: '',
//     name: '',
//     email: '',
//     password: '',
//     role: 'admin', // Default role
//   });

//   const navigate = useNavigate();

//   const handleChange = e => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     try {
//       // Send form data to FastAPI backend
//       await axios.post('/auth/register', form);
//       alert('User registered successfully');
//       navigate('/'); // Redirect to login page
//     } catch (error) {
//       alert(error.response?.data?.detail || 'Registration failed');
//     }
//   };

//   return (
//     <div className="container">
//       <h2>Admin/User Registration</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           name="emp_id"
//           placeholder="Employee ID"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="name"
//           placeholder="Name"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="email"
//           type="email"
//           placeholder="Email"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="password"
//           type="password"
//           placeholder="Password"
//           onChange={handleChange}
//           required
//         />
//         <select name="role" value={form.role} onChange={handleChange} required>
//           <option value="admin">Admin</option>
//         </select>
//         <button type="submit">Register</button>
//       </form>
//     </div>
//   );
// }
