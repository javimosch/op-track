import React, { useState } from 'react';
import axios from 'axios';
import { Navigate} from 'react-router-dom';


export const ProjectCreation = () => {
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