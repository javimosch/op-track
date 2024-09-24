import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Navigate, Routes } from 'react-router-dom';
import axios from 'axios';
import ProjectList from './ProjectList';
import 'chartjs-adapter-date-fns'; // Import the date adapter
import {Login,Register} from './Auth'
import { ProjectCreation } from './Project';
import Dashboard from './Dashboard'

const App = () => {
  // Add this line to debug the environment variable
  console.log('VITE_SERVER_URL:', import.meta.env.VITE_SERVER_URL);

  const [token, setToken] = useState(localStorage.getItem('token'));
  const setAxiosToken = () => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set default authorization header
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }
  setAxiosToken()
  useEffect(setAxiosToken, [token]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
  };

  return (
    <Router>
      <nav className="bg-white shadow-md p-4 flex justify-between items-center rounded-lg">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-lg font-bold text-green-600">Dashboard</Link>
          <a href={`${import.meta.env.VITE_SERVER_URL}/client`} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-green-600 transition duration-300">Test form</a>
          <a href="/api-docs" className="text-gray-700 hover:text-green-600 transition duration-300">Swagger docs</a>
          {true && (
            <>
              <Link to="/projects" className="text-gray-700 hover:text-green-600 transition duration-300">Projects</Link>
              <Link to="/create-project" className="text-gray-700 hover:text-green-600 transition duration-300">Create Project</Link>
            </>
          )}
        </div>
        {/* <div className="flex items-center space-x-6">
          {token ? (
            <>
              <span className="text-gray-800">{localStorage.getItem('email')}</span>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-300">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-green-600 transition duration-300">Login</Link>
              <Link to="/register" className="text-gray-700 hover:text-green-600 transition duration-300">Register</Link>
            </>
          )}
        </div> */}
      </nav>
      <Routes>
        {/* <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} /> */}
        {/* <Route path="/create-project" element={token ? <ProjectCreation /> : <Navigate to="/login" />} /> */}
        {/* <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} /> */}
        {/* <Route path="/projects" element={token ? <ProjectList /> : <Navigate to="/login" />} /> */}
        
        {/* Public */}
        <Route path="/create-project" element={<ProjectCreation />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectList />} />
      </Routes>
    </Router>
  );
};

export default App;