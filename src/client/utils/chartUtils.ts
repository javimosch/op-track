interface GraphSettings {
  type: string;
  yAxis: string;
  xAxis: string;
  groupBy: string;
}

interface AggregationSettings {
  groupBy: string[];
  aggregatedFields: Record<string, string[]>;
  metrics: any[];
}

export const aggregateData = (data: any[], aggregationSettings: AggregationSettings) => {
  if (aggregationSettings.groupBy.length === 0) return data;

  const groupedData = data.reduce((acc, item) => {
    const key = aggregationSettings.groupBy.map(field => {
      if (field.includes('-')) {
        const [field1, field2] = field.split('-');
        return `${item[field1] || item.tags?.[field1]}-${item[field2] || item.tags?.[field2]}`;
      }
      return item[field] || item.tags?.[field];
    }).join('-');

    if (!acc[key]) {
      acc[key] = {
        count: 0,
        ...aggregationSettings.groupBy.reduce((obj, field) => {
          if (field.includes('-')) {
            const [field1, field2] = field.split('-');
            obj[field] = `${item[field1] || item.tags?.[field1]}-${item[field2] || item.tags?.[field2]}`;
          } else {
            obj[field] = item[field] || item.tags?.[field];
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

const getFieldValue = (metric: any, field: string) => {
  return metric[field] || metric.tags?.[field] || 'Unknown';
};

export const prepareChartData = (metrics: any[], graphSettings: GraphSettings, aggregationSettings: AggregationSettings) => {
  const aggregatedData = aggregateData(metrics, aggregationSettings);

  if (graphSettings.type === 'line') {
    if (graphSettings.groupBy) {
      const groupedData = aggregatedData.reduce((acc, metric) => {
        const key = getFieldValue(metric, graphSettings.groupBy);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push({
          x: new Date(metric.datetime),
          y: getFieldValue(metric, graphSettings.yAxis)
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
            y: getFieldValue(metric, graphSettings.yAxis)
          })),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      };
    }
  } else if (graphSettings.type === 'bar') {
    const labels = aggregatedData.map(metric => getFieldValue(metric, graphSettings.xAxis));
    const data = aggregatedData.map(metric => getFieldValue(metric, graphSettings.yAxis));

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

export const getChartOptions = (graphSettings: GraphSettings, metrics: any[], setSelectedMetric: (metric: any) => void) => {
  return {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${graphSettings.yAxis} ${graphSettings.type === 'bar' ? `by ${graphSettings.xAxis}` : ''}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const metric = aggregateData(metrics, { groupBy: [], aggregatedFields: {}, metrics })[context.dataIndex];
            return `${graphSettings.yAxis}: ${getFieldValue(metric, graphSettings.yAxis)}\n${graphSettings.xAxis}: ${getFieldValue(metric, graphSettings.xAxis)}`;
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
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const metric = aggregateData(metrics, { groupBy: [], aggregatedFields: {}, metrics })[index];
        setSelectedMetric(metric);
      }
    }
  };
};