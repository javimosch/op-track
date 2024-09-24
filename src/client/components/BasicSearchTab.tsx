import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, TimeScale, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import ExportFeature from '../ExportButton';
import GraphSettings from './GraphSettings';
import AggregationSettings from './AggregationSettings';
import { prepareChartData, getChartOptions } from '../utils/chartUtils';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement
);

const BasicSearchTab = ({ 
  filters, 
  setFilters, 
  projects, 
  customFilters, 
  setCustomFilters, 
  newFilter, 
  setNewFilter, 
  addCustomFilter, 
  removeCustomFilter, 
  comparisonTypes, 
  handleRefresh, 
  graphSettings, 
  setGraphSettings, 
  aggregationSettings, 
  setAggregationSettings, 
  metrics, 
  selectedMetric, 
  setSelectedMetric 
}) => {
  const chartData = prepareChartData(metrics, graphSettings, aggregationSettings);
  
  console.log('chartData',{
    chartData
  })
  
 

  const options = getChartOptions(graphSettings, metrics, setSelectedMetric);


  return (
    <div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Basic Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

        <div className="mt-4">
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
      </div>

      <div className='mb-6'>
        <button 
          onClick={handleRefresh}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Check if chartData is available before rendering aggregation and graph settings */}
      {!chartData || !chartData.datasets.length ? (
        <div>No data available for the current filters.</div>
      ) : (
        <>
      <AggregationSettings
        settings={aggregationSettings}
        onSettingsChange={setAggregationSettings}
        availableFields={metrics.length > 0 ? [...Object.keys(metrics[0]), ...Object.keys(metrics[0].tags || {})] : []}
      />

      <GraphSettings rawData={metrics} settings={graphSettings} onSettingsChange={setGraphSettings} aggregationSettings={aggregationSettings} />

          { 
        graphSettings.type === 'line' ? (
          <Line data={chartData} options={options} />
        ) : graphSettings.type === 'bar' ? (
          <Bar data={chartData} options={options} />
        ) : graphSettings.type === 'doughnut' ? (
          <Doughnut data={chartData} options={options} />
        ) : graphSettings.type === 'pie' ? (
          <Pie data={chartData} options={options} />
            ) : null 
      }

      <div className="mt-6">
        <ExportFeature filters={filters} buttonText="Export as CSV" />
      </div>
      
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
        </>
      )}
    </div>
  );
};

export default BasicSearchTab;