# Chart Settings and Insights

This document outlines various aggregate and graph settings combinations to gain useful insights from our metric model. The metric model looks like:

```json
{
    "_id": "66df0cf4129025d50dcac0d0",
    "project": "66d587bcec2414cc320e6adf",
    "operation": "batch_test_operation",
    "startTime": "2024-08-08T20:46:07.533Z",
    "endTime": "2024-08-08T20:46:14.533Z",
    "duration": 7,
    "tags": {
        "clientName": "Paprec",
        "dataOrigin": "mysql",
        "loginName": "jarancibia",
        "userId": "15463",
        "batchTestId": "batch_301"
    },
    "datetime": "2024-08-08T20:46:14.533Z",
    "id": "66df0cf4129025d50dcac0d0"
}
```

## 1. Operation Duration Over Time

- **Graph Type**: Line Chart
- **Y-Axis**: duration
- **X-Axis**: datetime
- **Group By**: operation
- **Aggregation**: None
- **Insights**: This chart will show how the duration of different operations changes over time, allowing you to identify trends or patterns in performance.

## 2. Average Duration by Operation

- **Graph Type**: Bar Chart
- **Y-Axis**: duration (Avg)
- **X-Axis**: operation
- **Group By**: operation
- **Aggregation**: Average of duration
- **Insights**: This chart will display the average duration for each operation, helping you identify which operations are typically the most time-consuming.

## 3. Operation Frequency

- **Graph Type**: Bar Chart
- **Y-Axis**: Count
- **X-Axis**: operation
- **Group By**: operation
- **Aggregation**: Count
- **Insights**: This chart will show how frequently each operation is performed, helping you understand which operations are most common.

## 4. Duration by Data Origin

- **Graph Type**: Box Plot or Bar Chart
- **Y-Axis**: duration
- **X-Axis**: dataOrigin (from tags)
- **Group By**: dataOrigin
- **Aggregation**: Min, Max, Avg of duration
- **Insights**: This chart will help you understand how the data origin affects operation duration, potentially identifying slow data sources.

## 5. Client Performance Comparison

- **Graph Type**: Bar Chart
- **Y-Axis**: duration (Avg)
- **X-Axis**: clientName (from tags)
- **Group By**: clientName
- **Aggregation**: Average of duration
- **Insights**: This chart will show the average operation duration for each client, helping you identify if certain clients consistently experience slower performance.

## 6. User Performance Analysis

- **Graph Type**: Bar Chart
- **Y-Axis**: duration (Avg)
- **X-Axis**: loginName (from tags)
- **Group By**: loginName
- **Aggregation**: Average of duration
- **Insights**: This chart will display the average operation duration for each user, potentially highlighting users who might benefit from additional training or optimization of their workflows.

## 7. Operation-DataOrigin Performance

- **Graph Type**: Bar Chart
- **Y-Axis**: duration (Avg)
- **X-Axis**: operation-dataOrigin (computed field)
- **Group By**: operation, dataOrigin
- **Aggregation**: Average of duration
- **Insights**: This chart will show the average duration for each combination of operation and data origin, helping you identify specific operation-data source combinations that might be problematic.

## 8. Batch Test Performance

- **Graph Type**: Line Chart
- **Y-Axis**: duration
- **X-Axis**: datetime
- **Group By**: batchTestId (from tags)
- **Aggregation**: None
- **Insights**: This chart will show the duration of operations within each batch test over time, allowing you to track the performance of specific batch tests.

## 9. Project Comparison

- **Graph Type**: Bar Chart
- **Y-Axis**: duration (Avg)
- **X-Axis**: project
- **Group By**: project
- **Aggregation**: Average of duration
- **Insights**: This chart will display the average operation duration for each project, helping you compare performance across different projects.

## 10. Time of Day Analysis

- **Graph Type**: Line Chart
- **Y-Axis**: duration (Avg)
- **X-Axis**: Hour of Day (extracted from datetime)
- **Group By**: Hour of Day
- **Aggregation**: Average of duration
- **Insights**: This chart will show how operation duration varies throughout the day, potentially identifying peak load times or periods of decreased performance.

These chart configurations provide a comprehensive view of your metric data, allowing you to analyze performance from various angles such as operations, data sources, clients, users, projects, and time. By using these charts, you can identify trends, anomalies, and areas for potential optimization in your system.