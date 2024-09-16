import React from 'react';

interface AggregationSettingsProps {
  settings: {
    groupBy: string[];
    aggregatedFields: Record<string, string[]>;
    metrics: any[];
  };
  onSettingsChange: (newSettings: any) => void;
  availableFields: string[];
}

const AggregationSettings: React.FC<AggregationSettingsProps> = ({ settings, onSettingsChange, availableFields }) => {
  const handleReset = () => {
    onSettingsChange({
      groupBy: [],
      aggregatedFields: {},
      metrics: settings.metrics, // Assuming metrics should not be reset
    });
  };

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
            {availableFields.filter(field => typeof settings.metrics[0]?.[field] === 'number').map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleReset}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reset Aggregation
        </button>
      </div>
    </div>
  );
};

export default AggregationSettings;
