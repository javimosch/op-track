import React from "react";

interface GraphSettingsProps {
  settings: {
    type: string;
    yAxis: string;
    xAxis: string;
    groupBy: string;
  };
  onSettingsChange: (newSettings: any) => void;
  aggregationSettings: {
    aggregatedFields: Record<string, string[]>;
  };
  rawData: Array<any>;
}

const GraphSettings: React.FC<GraphSettingsProps> = ({
  settings,
  onSettingsChange,
  aggregationSettings,
  rawData,
}) => {
  let availableFields = [
    "operation",
    "clientName",
    "dataOrigin",
    "loginName",
    ...Object.keys(aggregationSettings.aggregatedFields),
    ...Object.keys(aggregationSettings.aggregatedFields).length>0?['count']:[]
  ];

  // Initialize uniqueKeys array
  const uniqueKeys = [];

  // Traverse rawData array and extract keys
  rawData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      //@ts-expect-error
      if (!uniqueKeys.includes(key)) {
        //@ts-expect-error
        uniqueKeys.push(key);
      }
    });
  });

  // Merge uniqueKeys into availableFields without duplication
  availableFields = [...new Set([...availableFields, ...uniqueKeys])];

  console.log("GraphSettings", {
    availableFields,
    rawData,
  });

  return (
    <div className="mb-6 p-4 bg-white rounded shadow-md">
      <h3 className="text-lg font-semibold mb-2">Graph Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Graph Type</label>
          <select
            value={settings.type}
            onChange={(e) =>
              onSettingsChange({ ...settings, type: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="doughnut">Doughnut</option>
            <option value="pie">Pie</option>
          </select>
        </div>
        <div>
          <label className="block mb-2">Y Axis</label>
          <select
            value={settings.yAxis}
            onChange={(e) =>
              onSettingsChange({ ...settings, yAxis: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            {availableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
            {Object.keys(aggregationSettings.aggregatedFields).map((field) => (
              <React.Fragment key={field}>
                <option value={`${field}Avg`}>{field} (Avg)</option>
                <option value={`${field}Min`}>{field} (Min)</option>
                <option value={`${field}Max`}>{field} (Max)</option>
              </React.Fragment>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2">X Axis (Bar Chart)</label>
          <select
            value={settings.xAxis}
            onChange={(e) =>
              onSettingsChange({ ...settings, xAxis: e.target.value })
            }
            className="w-full p-2 border rounded"
            disabled={settings.type !== "bar"}
          >
            {availableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2">Group By (Line Chart)</label>
          <select
            value={settings.groupBy}
            onChange={(e) =>
              onSettingsChange({ ...settings, groupBy: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            <option value="">None</option>
            {availableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default GraphSettings;
