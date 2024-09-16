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

const getDataValue = (item: any, key: string) => {
  if (item.tags && item.tags[key] !== undefined) {
    return item.tags[key];
  }
  if (item[key] !== undefined) {
    return item[key];
  }
  return "Unknown";
};

export const aggregateData = (
  data: any[],
  aggregationSettings: AggregationSettings
) => {
  if (aggregationSettings.groupBy.length === 0) return data;

  const groupedData = data.reduce((acc: Record<string, any>, item) => {
    const key = aggregationSettings.groupBy
      .map((field) => {
        if (field.includes("-")) {
          const [field1, field2] = field.split("-");
          return `${getDataValue(item, field1)}-${getDataValue(item, field2)}`;
        }
        return getDataValue(item, field);
      })
      .join("-");

    if (!acc[key]) {
      acc[key] = {
        count: 0,
        ...aggregationSettings.groupBy.reduce((obj, field) => {
          if (field.includes("-")) {
            const [field1, field2] = field.split("-");
            obj[field] = `${getDataValue(item, field1)}-${getDataValue(
              item,
              field2
            )}`;
          } else {
            obj[field] = getDataValue(item, field);
          }
          return obj;
        }, {}),
      };
    }
    acc[key].count++;
    Object.keys(aggregationSettings.aggregatedFields).forEach((field) => {
      if (typeof getDataValue(item, field) === "number") {
        if (!acc[key][`${field}Sum`]) acc[key][`${field}Sum`] = 0;
        if (!acc[key][`${field}Min`])
          acc[key][`${field}Min`] = getDataValue(item, field);
        if (!acc[key][`${field}Max`])
          acc[key][`${field}Max`] = getDataValue(item, field);
        acc[key][`${field}Sum`] += getDataValue(item, field);
        acc[key][`${field}Min`] = Math.min(
          acc[key][`${field}Min`],
          getDataValue(item, field)
        );
        acc[key][`${field}Max`] = Math.max(
          acc[key][`${field}Max`],
          getDataValue(item, field)
        );
      }
    });
    return acc;
  }, {});

  return Object.values(groupedData).map((group) => ({
    ...group,
    ...Object.keys(aggregationSettings.aggregatedFields).reduce(
      (obj, field) => {
        obj[`${field}Avg`] = group[`${field}Sum`] / group.count;
        return obj;
      },
      {}
    ),
  }));
};

export const prepareChartData = (
  metrics: any[],
  graphSettings: GraphSettings,
  aggregationSettings: AggregationSettings
) => {
  const aggregatedDataResult = aggregateData(metrics, aggregationSettings);

  console.log({
    aggregatedDataResult,
  });

  if (graphSettings.type === "line") {
    if (graphSettings.groupBy) {
      const groupedData = aggregatedDataResult.reduce((acc, metric) => {
        const key = getDataValue(metric, graphSettings.groupBy);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push({
          x: new Date(metric.datetime),
          y: getDataValue(metric, graphSettings.yAxis),
        });
        return acc;
      }, {});

      return {
        labels: aggregatedDataResult.map((metric) => new Date(metric.datetime)),
        datasets: Object.entries(groupedData).map(([key, data], index) => ({
          label: key,
          data: data,
          borderColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
          tension: 0.1,
        })),
      };
    } else {
      return {
        labels: aggregatedDataResult.map((metric) => new Date(metric.datetime)),
        datasets: [
          {
            label: graphSettings.yAxis,
            data: aggregatedDataResult.map((metric) => ({
              x: new Date(metric.datetime),
              y: getDataValue(metric, graphSettings.yAxis),
            })),
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      };
    }
  } else if (graphSettings.type === "bar") {
    const labels = aggregatedDataResult.map((metric) =>
      getDataValue(metric, graphSettings.xAxis)
    );
    const data = aggregatedDataResult.map((metric) =>
      getDataValue(metric, graphSettings.yAxis)
    );

    return {
      labels: labels,
      datasets: [
        {
          label: `${graphSettings.yAxis} by ${graphSettings.xAxis}`,
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgb(75, 192, 192)",
          borderWidth: 1,
        },
      ],
    };
  } else if (
    graphSettings.type === "pie" ||
    graphSettings.type === "doughnut"
  ) {
    const labels = aggregatedDataResult.map((metric) =>
      getDataValue(metric, graphSettings.groupBy)
    );
    const data = aggregatedDataResult.map((metric) =>
      getDataValue(metric, graphSettings.yAxis)
    );

    console.log({
      dataset: "default",
      labels,
      data,
      aggregatedDataResult,
      yAxis: graphSettings.yAxis,
    });

    return {
      labels: labels,
      datasets: [
        {
          label: graphSettings.yAxis,
          data: data,
          backgroundColor: data.map(
            (_, index) => `hsl(${(index * 137.5) % 360}, 70%, 50%)`
          ),
          hoverBackgroundColor: data.map(
            (_, index) => `hsl(${(index * 137.5) % 360}, 80%, 60%)`
          ),
        },
      ],
    };
  }
};

export const getChartOptions = (
  graphSettings: GraphSettings,
  metrics: any[],
  setSelectedMetric: (metric: any) => void
) => {
  const isPieOrDoughnut =
    graphSettings.type === "pie" || graphSettings.type === "doughnut";

  return {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: isPieOrDoughnut
          ? `${graphSettings.yAxis}`
          : `${graphSettings.yAxis} ${
              graphSettings.type === "bar" ? `by ${graphSettings.xAxis}` : ""
            }`,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            console.log("tooltip.callback", {
              yAxis: graphSettings.yAxis,
              context,
            });
            return `${graphSettings.yAxis}: ${context.formattedValue}`;
          },
        },
      },
    },
    ...(isPieOrDoughnut?{}:{onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const metric = aggregateData(metrics, { groupBy: [], aggregatedFields: {}, metrics })[index];
        setSelectedMetric(metric);
      }
    }}),
    scales: isPieOrDoughnut
      ? undefined
      : {
          x: {
            type:
              graphSettings.type === "line"
                ? ("time" as const)
                : ("category" as const),
            time:
              graphSettings.type === "line"
                ? {
                    unit: "day",
                    tooltipFormat: "MMM dd, yyyy",
                  }
                : undefined,
            title: {
              display: true,
            },
            y: {
              type: "linear" as const,
              title: {
                display: true,
                text: graphSettings.yAxis,
              },
            },
          },
        },
  };
};
