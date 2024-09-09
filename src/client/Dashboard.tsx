import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, TimeScale } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ExportFeature from './ExportButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, TimeScale);

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

const GraphSettings = ({ settings, onSettingsChange, aggregationSettings }) => {
  const availableFields = ['operation', 'clientName', 'dataOrigin', 'loginName', ...Object.keys(aggregationSettings.aggregatedFields)];

  return (
    <div className="mb-6 p-4 bg-white rounded shadow-md">
      <h3 className="text-lg font-semibold mb-2">Graph Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Graph Type</label>
          <select
            value={settings.type}
            onChange={(e) => onSettingsChange({ ...settings, type: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
          </select>
        </div>
        <div>
          <label className="block mb-2">Y Axis</label>
          <select
            value={settings.yAxis}
            onChange={(e) => onSettingsChange({ ...settings, yAxis: e.target.value })}
            className="w-full p-2 border rounded"
          >
            {availableFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
            {Object.keys(aggregationSettings.aggregatedFields).map(field => (
              <>
                <option key={`${field}Avg`} value={`${field}Avg`}>{field} (Avg)</option>
                <option key={`${field}Min`} value={`${field}Min`}>{field} (Min)</option>
                <option key={`${field}Max`} value={`${field}Max`}>{field} (Max)</option>
              </>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2">X Axis (Bar Chart)</label>
          <select
            value={settings.xAxis}
            onChange={(e) => onSettingsChange({ ...settings, xAxis: e.target.value })}
            className="w-full p-2 border rounded"
            disabled={settings.type !== 'bar'}
          >
            {availableFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2">Group By (Line Chart)</label>
          <select
            value={settings.groupBy}
            onChange={(e) => onSettingsChange({ ...settings, groupBy: e.target.value })}
            className="w-full p-2 border rounded"
            disabled={settings.type !== 'line'}
          >
            <option value="">None</option>
            {availableFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const AggregationSettings = ({ settings, onSettingsChange, availableFields }) => {
  return (
    <div className="mb-6 p-4 bg-white rounded shadow-md">
      <h3 className="text-lg font-semibold mb-2">Front-end Aggregation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Group By</label>
          <select
            multiple
            value={settings.groupBy}
            onChange={(e) => onSettingsChange({ ...settings, groupBy: Array.from(e.target.selectedOptions, option => option.value) })}
            className="w-full p-2 border rounded"
          >
            {availableFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2">Aggregate Fields</label>
          <select
            multiple
            value={Object.keys(settings.aggregatedFields)}
            onChange={(e) => {
              const selectedFields = Array.from(e.target.selectedOptions, option => option.value);
              const newAggregatedFields = {};
              selectedFields.forEach(field => {
                newAggregatedFields[field] = settings.aggregatedFields[field] || ['avg', 'min', 'max'];
              });
              onSettingsChange({ ...settings, aggregatedFields: newAggregatedFields });
            }}
            className="w-full p-2 border rounded"
          >
            {availableFields.filter(field => typeof settings.metrics[0][field] === 'number').map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [filters, setFilters] = useState(() => loadFromLocalStorage('dashboardFilters', {}));
  const [projects, setProjects] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [customFilters, setCustomFilters] = useState(() => loadFromLocalStorage('dashboardCustomFilters', []));
  const [newFilter, setNewFilter] = useState({ key: '', value: '', type: 'equal' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [graphSettings, setGraphSettings] = useState(() => loadFromLocalStorage('graphSettings', {
    type: 'line',
    yAxis: 'duration',
    xAxis: 'operation',
    groupBy: ''
  }));
  const [aggregationSettings, setAggregationSettings] = useState(() => loadFromLocalStorage('aggregationSettings', {
    groupBy: [],
    aggregatedFields: {},
    metrics: []
  }));

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
      setAggregationSettings(prevSettings => ({
        ...prevSettings,
        metrics: data
      }));
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

  useEffect(() => {
    saveToLocalStorage('dashboardFilters', filters);
  }, [filters]);

  useEffect(() => {
    saveToLocalStorage('graphSettings', graphSettings);
  }, [graphSettings]);

  useEffect(() => {
    saveToLocalStorage('aggregationSettings', aggregationSettings);
  }, [aggregationSettings]);

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

  const aggregateData = (data) => {
    if (aggregationSettings.groupBy.length === 0) return data;

    const groupedData = data.reduce((acc, item) => {
      const key = aggregationSettings.groupBy.map(field => {
        if (field.includes('-')) {
          const [field1, field2] = field.split('-');
          return `${item[field1] || item.tags[field1]}-${item[field2] || item.tags[field2]}`;
        }
        return item[field] || item.tags[field];
      }).join('-');

      if (!acc[key]) {
        acc[key] = {
          count: 0,
          ...aggregationSettings.groupBy.reduce((obj, field) => {
            if (field.includes('-')) {
              const [field1, field2] = field.split('-');
              obj[field] = `${item[field1] || item.tags[field1]}-${item[field2] || item.tags[field2]}`;
            } else {
              obj[field] = item[field] || item.tags[field];
            }
            return obj;
          }, {})
        };
      }
      acc[key].count++;
      Object.keys(aggregationSettings.aggregatedFields).forEach(field => {
        if (typeof item[field] === 'number') {
          if (!acc[key][`${field}Sum`]) acc[key][`${field}Sum`] = 0;
          if (!acc[key][`${field}Min`]) acc[key][`${field}Min`] = item[field];
          if (!acc[key][`${field}Max`]) acc[key][`${field}Max`] = item[field];
          acc[key][`${field}Sum`] += item[field];
          acc[key][`${field}Min`] = Math.min(acc[key][`${field}Min`], item[field]);
          acc[key][`${field}Max`] = Math.max(acc[key][`${field}Max`], item[field]);
        }
      });
      return acc;
    }, {});

    return Object.values(groupedData).map(group => ({
      ...group,
      ...Object.keys(aggregationSettings.aggregatedFields).reduce((obj, field) => {
        obj[`${field}Avg`] = group[`${field}Sum`] / group.count;
        return obj;
      }, {})
    }));
  };

  const prepareChartData = () => {
    const aggregatedData = aggregateData(metrics);

    if (graphSettings.type === 'line') {
      if (graphSettings.groupBy) {
        const groupedData = aggregatedData.reduce((acc, metric) => {
          const key = metric[graphSettings.groupBy] || 'Unknown';
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push({
            x: new Date(metric.datetime),
            y: metric[graphSettings.yAxis]
          });
          return acc;
        }, {});

        return {
          labels: aggregatedData.map(metric => new Date(metric.datetime)),
          datasets: Object.entries(groupedData).map(([key, data], index) => ({
            label: key,
            data: data,
            borderColor: `hsl(${index * 137.5 % 360}, 70%, 50%)`,
            tension: 0.1
          }))
        };
      } else {
        return {
          labels: aggregatedData.map(metric => new Date(metric.datetime)),
          datasets: [{
            label: graphSettings.yAxis,
            data: aggregatedData.map(metric => ({
              x: new Date(metric.datetime),
              y: metric[graphSettings.yAxis]
            })),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        };
      }
    } else if (graphSettings.type === 'bar') {
      const labels = aggregatedData.map(metric => metric[graphSettings.xAxis] || 'Unknown');
      const data = aggregatedData.map(metric => metric[graphSettings.yAxis]);

      return {
        labels: labels,
        datasets: [{
          label: `${graphSettings.yAxis} by ${graphSettings.xAxis}`,
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }]
      };
    }
  };

  const chartData = prepareChartData();

  console.log('Chart data:', chartData);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${graphSettings.yAxis} ${graphSettings.type === 'bar' ? `by ${graphSettings.xAxis}` : ''}`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const metric = aggregateData(metrics)[context.dataIndex];
            return `${graphSettings.yAxis}: ${context.parsed.y}\n${graphSettings.xAxis}: ${metric[graphSettings.xAxis]}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: graphSettings.type === 'line' ? 'time' : 'category',
        time: graphSettings.type === 'line' ? {
          unit: 'day',
          tooltipFormat: 'MMM dd, yyyy'
        } : undefined,
        title: {
          display: true,
          text: graphSettings.type === 'line' ? 'Date' : graphSettings.xAxis
        }
      },
      y: {
        title: {
          display: true,
          text: graphSettings.yAxis
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const metric = aggregateData(metrics)[index];
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

      <AggregationSettings
        settings={aggregationSettings}
        onSettingsChange={setAggregationSettings}
        availableFields={metrics.length > 0 ? [...Object.keys(metrics[0]), ...Object.keys(metrics[0].tags)] : []}
      />

      <GraphSettings settings={graphSettings} onSettingsChange={setGraphSettings} aggregationSettings={aggregationSettings} />

      {graphSettings.type === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}

      {selectedMetric && (
        <div className="mt-6 p-4 bg-white rounded shadow-md">
          <h2 className="text-lg font-bold mb-2">Operation Details</h2>
          {Object.entries(selectedMetric).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;