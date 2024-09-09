import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, TimeScale } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ExportFeature from './ExportButton';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, TimeScale);

// Helper functions for localStorage
const loadFromLocalStorage = (key, defaultValue) => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Error parsing localStorage for key ${key}:`, error);
    }
  }
  return defaultValue;
};

const saveToLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [filters, setFilters] = useState(() => loadFromLocalStorage('dashboardFilters', {}));
  const [projects, setProjects] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [customFilters, setCustomFilters] = useState(() => loadFromLocalStorage('dashboardCustomFilters', []));
  const [newFilter, setNewFilter] = useState({ key: '', value: '', type: 'equal' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const comparisonTypes = ['equal', 'greaterThan', 'lowerThan', 'stringContains', 'in'];

  const updateCustomFilters = (newCustomFilters) => {
    setCustomFilters(newCustomFilters);
    saveToLocalStorage('dashboardCustomFilters', newCustomFilters);
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams(filters);
      customFilters.forEach(filter => {
        queryParams.append(filter.key, filter.value);
      });
      queryParams.append('comparisonTypes', customFilters.map(f => `${f.key}-${f.type}`).join('|'));

      const response = await axios.get('/api/metrics', { params: queryParams });
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('Fetched metrics:', data);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, [filters, customFilters]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, refreshTrigger]);

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

  // Save filters to localStorage when they change
  useEffect(() => {
    saveToLocalStorage('dashboardFilters', filters);
  }, [filters]);

  const addCustomFilter = () => {
    if (newFilter.key && newFilter.value) {
      updateCustomFilters([...customFilters, newFilter]);
      setNewFilter({ key: '', value: '', type: 'equal' });
    }
  };

  const removeCustomFilter = (index) => {
    const updatedFilters = customFilters.filter((_, i) => i !== index);
    updateCustomFilters(updatedFilters);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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

  console.log('Chart data:', chartData);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
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
          tooltipFormat: 'MMM dd, yyyy'
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
        setSelectedMetric(metric);
      }
    }
  };

  return (
    <div className="p-6">
      <ExportFeature filters={filters} />
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <select 
          value={filters.project || ''}
          onChange={(e) => setFilters({...filters, project: e.target.value})} 
          className="p-2 border rounded"
        >
          <option value="">Select Project</option>
          {projects.map(project => (
            <option key={project._id} value={project.name}>{project.name}</option>
          ))}
        </select>
        <input 
          type="text" 
          placeholder="Operation" 
          value={filters.operation || ''}
          onChange={(e) => setFilters({...filters, operation: e.target.value})} 
          className="p-2 border rounded" 
        />
        <input 
          type="date" 
          value={filters.startDate || ''}
          onChange={(e) => setFilters({...filters, startDate: e.target.value})} 
          className="p-2 border rounded" 
        />
        <input 
          type="date" 
          value={filters.endDate || ''}
          onChange={(e) => setFilters({...filters, endDate: e.target.value})} 
          className="p-2 border rounded" 
        />
       
      </div>

      {/* Custom Filter Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Custom Filters</h3>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            placeholder="Key"
            value={newFilter.key}
            onChange={(e) => setNewFilter({...newFilter, key: e.target.value})}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Value"
            value={newFilter.value}
            onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
            className="p-2 border rounded"
          />
          <select
            value={newFilter.type}
            onChange={(e) => setNewFilter({...newFilter, type: e.target.value})}
            className="p-2 border rounded"
          >
            {comparisonTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button onClick={addCustomFilter} className="p-2 bg-blue-500 text-white rounded">Add Filter</button>
        </div>
        {customFilters.map((filter, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <span>{filter.key} {filter.type} {filter.value}</span>
            <button onClick={() => removeCustomFilter(index)} className="p-1 bg-red-500 text-white rounded">Remove</button>
          </div>
        ))}
      </div>

      <div className='mb-6'>
      <button 
          onClick={handleRefresh}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Refresh
        </button>
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

export default Dashboard;