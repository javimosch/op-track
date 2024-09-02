import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects');
        setProjects(response.data);
      } catch (error) {
        setError('Failed to fetch projects');
      }
    };
    fetchProjects();
  }, []);

  const generateApiKey = async (projectId) => {
    try {
      const response = await axios.post(`/api/projects/${projectId}/generate-api-key`);
      setProjects(projects.map(project => 
        project._id === projectId ? { ...project, apiKey: response.data.apiKey } : project
      ));
    } catch (error) {
      setError('Failed to generate API key');
    }
  };

  return (
    <div className="p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <ul className="space-y-4">
        {projects.map(project => (
          <li key={project._id} className="p-4 bg-white rounded shadow-md flex justify-between items-center">
            <div>
              <div className="font-bold">{project.name}</div>
              <div className="text-sm text-gray-600">API Key: {project.apiKey}</div>
            </div>
            <button onClick={() => generateApiKey(project._id)} className="bg-blue-500 text-white px-3 py-1 rounded">Generate API Key</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectList;
