import React, { useState } from 'react';
import axios from 'axios';
import { Navigate} from 'react-router-dom';

export const Login = ({ setToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post('/api/login', { email, password });
        const token = response.data.token;
        setToken(token);
        localStorage.setItem('token', token); // Store JWT in localStorage
        localStorage.setItem('email', email);
      } catch (error) {
        setError('Invalid credentials');
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="w-full p-2 mb-4 border rounded" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="w-full p-2 mb-4 border rounded" />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Login</button>
      </form>
    );
  };
  
  export const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post('/api/register', { email, password });
        setSuccess(true);
      } catch (error) {
        setError('Registration failed. Please try again.');
      }
    };
  
    if (success) {
      return <Navigate to="/login" />;
    }
  
    return (
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="w-full p-2 mb-4 border rounded" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="w-full p-2 mb-4 border rounded" />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Register</button>
      </form>
    );
  };