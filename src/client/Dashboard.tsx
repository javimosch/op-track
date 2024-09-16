import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import BasicSearchTab from './components/BasicSearchTab';
import CustomSearchTab from './components/CustomSearchTab';

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

  useEffect(() => {
    console.log('aggregationSettings updated:', aggregationSettings);
  }, [aggregationSettings]);
  
  const [aggregateQuery, setAggregateQuery] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [isAggregateView, setIsAggregateView] = useState(false);
  const [aggregateResults, setAggregateResults] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');

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

  const handleAggregateSearch = async () => {
    try {
      const response = await axios.post('/api/metrics/aggregate', { query: aggregateQuery });
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('Aggregate search results:', data);
      setAggregateResults(data);
      setIsAggregateView(true);
    } catch (error) {
      console.error('Failed to perform aggregate search:', error);
    }
  };

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

  return (
    <div className="p-6">
      <div className="mb-4">
        <button
          onClick={() => setActiveTab('basic')}
          className={`mr-2 p-2 ${activeTab === 'basic' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded`}
        >
          Basic Search
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`p-2 ${activeTab === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded`}
        >
          Custom Search
        </button>
      </div>

      {activeTab === 'basic' ? (
        <BasicSearchTab
          filters={filters}
          setFilters={setFilters}
          projects={projects}
          customFilters={customFilters}
          setCustomFilters={setCustomFilters}
          newFilter={newFilter}
          setNewFilter={setNewFilter}
          addCustomFilter={addCustomFilter}
          removeCustomFilter={removeCustomFilter}
          comparisonTypes={comparisonTypes}
          handleRefresh={handleRefresh}
          graphSettings={graphSettings}
          setGraphSettings={setGraphSettings}
          aggregationSettings={aggregationSettings}
          setAggregationSettings={setAggregationSettings}
          metrics={metrics}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
        />
      ) : (
        <CustomSearchTab
          naturalLanguageQuery={naturalLanguageQuery}
          setNaturalLanguageQuery={setNaturalLanguageQuery}
          aggregateQuery={aggregateQuery}
          setAggregateQuery={setAggregateQuery}
          handleAggregateSearch={handleAggregateSearch}
          aggregateResults={aggregateResults}
          setIsAggregateView={setIsAggregateView}
        />
      )}
    </div>
  );
};

export default Dashboard;