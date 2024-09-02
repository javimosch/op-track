import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Navigate, Routes } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, TimeScale } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import ProjectList from './ProjectList';
import 'chartjs-adapter-date-fns'; // Import the date adapter
import ExportFeature from './ExportButton';

// Register the necessary components for the line chart
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, TimeScale);

const Login = ({ setToken }) => {
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

const Register = () => {
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

const ProjectCreation = () => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/projects', { name: projectName });
      setSuccess(true);
    } catch (error) {
      setError('Project creation failed. Please try again.');
    }
  };

  if (success) {
    return <Navigate to="/" />;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} required placeholder="Project Name" className="w-full p-2 mb-4 border rounded" />
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Create Project</button>
    </form>
  );
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState([]); // Ensure metrics is initialized as an array
  const [filters, setFilters] = useState({});
  const [projects, setProjects] = useState([]); // State to store projects
  const [selectedMetric, setSelectedMetric] = useState(null); // State to store selected metric

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('/api/metrics', { params: filters });
        const data = Array.isArray(response.data) ? response.data : [];
        console.log('Fetched metrics:', data); // Log fetched metrics
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };
    fetchMetrics();
  }, [filters]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const chartData = {
    labels: metrics.map(metric => new Date(metric.datetime)),
    datasets: [{
      label: 'Operation Duration',
      data: metrics.map(metric => ({
        x: new Date(metric.datetime),
        y: metric.duration
      })),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  console.log('Chart data:', chartData); // Log chart data

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Operation Durations',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const metric = metrics[context.dataIndex];
            return `Duration: ${metric.duration} ms\nOperation: ${metric.operation}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM dd, yyyy' // Show more detailed date format in tooltip
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Duration (ms)'
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const metric = metrics[index];
        setSelectedMetric(metric); // Set the selected metric
      }
    }
  };

  return (
    <div className="p-6">
      <ExportFeature filters={filters} /> {/* Include the ExportFeature component */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <select onChange={(e) => setFilters({...filters, project: e.target.value})} className="p-2 border rounded">
          <option value="">Select Project</option>
          {projects.map(project => (
            <option key={project._id} value={project.name}>{project.name}</option>
          ))}
        </select>
        <input type="text" placeholder="Operation" onChange={(e) => setFilters({...filters, operation: e.target.value})} className="p-2 border rounded" />
        <input type="text" placeholder="User" onChange={(e) => setFilters({...filters, user: e.target.value})} className="p-2 border rounded" />
        <input type="text" placeholder="DB Origin" onChange={(e) => setFilters({...filters, dbOrigin: e.target.value})} className="p-2 border rounded" />
        <input type="date" onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="p-2 border rounded" />
        <input type="date" onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="p-2 border rounded" />
      </div>
      <Line data={chartData} options={options} />
      {selectedMetric && (
        <div className="mt-6 p-4 bg-white rounded shadow-md">
          <h2 className="text-lg font-bold mb-2">Operation Details</h2>
          <p><strong>Operation:</strong> {selectedMetric.operation}</p>
          <p><strong>Duration:</strong> {selectedMetric.duration} ms</p>
          <p><strong>Date:</strong> {new Date(selectedMetric.datetime).toLocaleString()}</p>
          {Object.keys(selectedMetric).map(key => (
            key !== 'operation' && key !== 'user' && key !== 'duration' && key !== 'datetime' && (
              <div key={key}>
                <strong>{key}:</strong> {typeof selectedMetric[key] === 'object' ? JSON.stringify(selectedMetric[key]) : selectedMetric[key]}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

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
          <a href={`${import.meta.env.VITE_SERVER_URL}/client`} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-green-600 transition duration-300">Client demo</a>
          <a href="/api-docs" className="text-gray-700 hover:text-green-600 transition duration-300">Swagger docs</a>
          {token && (
            <>
              <Link to="/projects" className="text-gray-700 hover:text-green-600 transition duration-300">Projects</Link>
              <Link to="/create-project" className="text-gray-700 hover:text-green-600 transition duration-300">Create Project</Link>
            </>
          )}
        </div>
        <div className="flex items-center space-x-6">
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
        </div>
      </nav>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-project" element={token ? <ProjectCreation /> : <Navigate to="/login" />} />
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/projects" element={token ? <ProjectList /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;