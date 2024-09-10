import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

const CustomSearchTab = ({ naturalLanguageQuery, setNaturalLanguageQuery, aggregateQuery, setAggregateQuery, handleAggregateSearch, aggregateResults, setIsAggregateView }) => {
  const [savedQueries, setSavedQueries] = useState(() => loadFromLocalStorage('savedQueries', []));
  const [suggestionQueries] = useState([
    "Show me the average duration of operations for each project in the last month",
    "List the top 5 longest running operations across all projects",
    "Count the number of operations per day for the 'backend' project in the past week"
  ]);

  useEffect(() => {
    saveToLocalStorage('savedQueries', savedQueries);
  }, [savedQueries]);

  const handleSaveQuery = (naturalQuery, mongoQuery) => {
    if (naturalQuery && mongoQuery && !savedQueries.some(q => q.naturalQuery === naturalQuery)) {
      setSavedQueries([...savedQueries, { naturalQuery, mongoQuery }]);
    }
  };

  const handleApplyQuery = (query) => {
    setNaturalLanguageQuery(query.naturalQuery);
    setAggregateQuery(query.mongoQuery);
  };

  const handleRemoveQuery = (query) => {
    setSavedQueries(savedQueries.filter(q => q.naturalQuery !== query.naturalQuery));
  };

  const handleGenerateAndSaveQuery = async () => {
    try {
      const response = await axios.post('/api/generate-aggregate-query', { naturalQuery: naturalLanguageQuery });
      const mongoQuery = response.data.query;
      setAggregateQuery(mongoQuery);
      handleSaveQuery(naturalLanguageQuery, mongoQuery);
    } catch (error) {
      console.error('Failed to generate aggregate query:', error);
    }
  };

  const renderDynamicTable = () => {
    if (aggregateResults.length === 0) return <p>No results to display.</p>;

    const headers = Object.keys(aggregateResults[0]);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              {headers.map((header, index) => (
                <th key={index} className="py-3 px-6 text-left">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {aggregateResults.map((result, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-100">
                {headers.map((header, cellIndex) => (
                  <td key={cellIndex} className="py-3 px-6 text-left whitespace-nowrap">
                    {typeof result[header] === 'object' ? JSON.stringify(result[header]) : result[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Custom Search</h2>
      <div className="flex space-x-2 mb-2">
        <input
          type="text"
          value={naturalLanguageQuery}
          onChange={(e) => setNaturalLanguageQuery(e.target.value)}
          placeholder="Enter natural language query"
          className="flex-grow p-2 border rounded"
        />
        <button 
          onClick={handleGenerateAndSaveQuery}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Generate query
        </button>
      </div>
      <textarea
        value={aggregateQuery}
        onChange={(e) => setAggregateQuery(e.target.value)}
        placeholder="Enter custom MongoDB aggregate query"
        className="w-full p-2 border rounded h-32"
      />
      <button 
        onClick={handleAggregateSearch}
        className="mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Run Aggregate Query
      </button>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Saved Queries</h3>
        <ul className="space-y-2">
          {savedQueries.map((query, index) => (
            <li key={index} className="flex items-center space-x-2">
              <span>{query.naturalQuery}</span>
              <button 
                onClick={() => handleApplyQuery(query)}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Apply
              </button>
              <button 
                onClick={() => handleRemoveQuery(query)}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Suggested Queries</h3>
        <ul className="space-y-2">
          {suggestionQueries.map((query, index) => (
            <li key={index} className="flex items-center space-x-2">
              <span>{query}</span>
              <button 
                onClick={() => setNaturalLanguageQuery(query)}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Apply
              </button>
            </li>
          ))}
        </ul>
      </div>

      {renderDynamicTable()}
    </div>
  );
};

export default CustomSearchTab;