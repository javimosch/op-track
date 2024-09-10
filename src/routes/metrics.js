import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../auth.js";
import { sendCustomEvent } from "../signoz.js";
import mongoose from "mongoose";
const ISODate = ()=> new Date();

const router = Router();

export async function createMetric(metricData) {
  const Metric = mongoose.model("Metric");
  const metric = new Metric(metricData);
  await metric.save();

  await sendCustomEvent(metricData.operation, {
    startTime: metricData.startTime,
    endTime: metricData.endTime,
    duration: metricData.duration,
    ...metricData.tags,
  });

  return metric;
}

router.post(
  "/",
  body("operation").isString().notEmpty(),
  body("startTime").isISO8601(),
  body("endTime").isISO8601(),
  body("duration").isNumeric(),
  body("tags").isObject(),
  async (req, res) => {
    const Project = mongoose.model("Project");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const project = await Project.findOne({
        apiKey: req.headers["x-api-key"] || req.body._token,
      });
      if (!project) return res.status(401).json({ error: "Invalid API key" });

      const metricData = {
        project: project._id,
        operation: req.body.operation,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        duration: req.body.duration,
        tags: req.body.tags,
      };

      await createMetric(metricData);

      res.status(201).json({ message: "Metric saved successfully" });
    } catch (error) {
      console.error("Error creating metric:", error);
      res
        .status(500)
        .json({ error: "An error occurred while saving the metric" });
    }
  }
);

router.get("/export", authenticateToken, async (req, res) => {
  try {
    const Metric = mongoose.model("Metric");
    const query = { ...req.query };
    // Apply filters similar to the metrics retrieval
    const validFields = [
      "operation",
      "startTime",
      "endTime",
      "duration",
      "project",
    ];
    const filter = Object.keys(query).reduce((acc, key) => {
      if (validFields.includes(key)) {
        acc[key] = query[key];
      } else if (query[key] !== "") {
        acc[`tags.${key}`] = query[key];
      }
      return acc;
    }, {});

    const metrics = await Metric.find(filter);

    // Convert metrics to CSV format
    const csv = metrics.map((metric) => ({
      operation: metric.operation,
      startTime: metric.startTime,
      endTime: metric.endTime,
      duration: metric.duration,
      tags: JSON.stringify(metric.tags),
    }));

    // Create TSV string with line breaks for Excel/LibreOffice compatibility
    const tsvString = [
      ["Operation", "Start Time", "End Time", "Duration", "Tags"],
      ...csv.map((row) => [
        row.operation,
        row.startTime,
        row.endTime,
        row.duration,
        // Convert tags object to a string, replace commas, and trim whitespace
        row.tags ? JSON.stringify(row.tags).replace(/,/g, ";").trim() : "",
      ]),
    ]
      .map((e) => e.join("\t"))
      .join("\r\n"); // Use \t for tab separation and \r\n for line breaks

    // Set headers for download
    res.header("Content-Type", "text/csv");
    res.attachment("metrics.csv");
    res.send(tsvString);
  } catch (error) {
    console.error("Error exporting metrics:", error);
    res
      .status(500)
      .json({ error: "An error occurred while exporting metrics" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const Project = mongoose.model("Project");
    const Metric = mongoose.model("Metric");
    const query = { ...req.query };
    if (query.startDate) {
      query.startTime = { $gte: new Date(query.startDate) };
      delete query.startDate;
    }
    if (query.endDate) {
      query.endTime = { $lte: new Date(query.endDate) };
      delete query.endDate;
    }
    if (query.project) {
      const project = await Project.findOne({ name: query.project });
      if (project) {
        query.project = project._id; // Use the found project's ID
      } else {
        return res.status(400).json({ error: "Project not found" });
      }
    }

    const comparisonTypes = query.comparisonTypes
      ? query.comparisonTypes.split("|").map((typeStr) => {
          const [key, type] = typeStr.split("-");
          return { key, type };
        })
      : [];
    delete query.comparisonTypes;

    const validFields = [
      "operation",
      "startTime",
      "endTime",
      "duration",
      "project",
    ]; // Define valid fields for the query

    const filter = Object.keys(query).reduce((acc, key) => {
      if (validFields.includes(key)) {
        if (query[key] !== "") {
          acc[key] = query[key];
        }
      } else if (query[key] !== "") {
        const comparisonType = comparisonTypes.find((ct) => ct.key === key);
        if (comparisonType) {
          switch (comparisonType.type) {
            case "equal":
              acc[`tags.${key}`] = query[key];
              break;
            case "greaterThan":
              acc[`tags.${key}`] = { $gt: parseFloat(query[key]) };
              break;
            case "lowerThan":
              acc[`tags.${key}`] = { $lt: parseFloat(query[key]) };
              break;
            case "stringContains":
              acc[`tags.${key}`] = { $regex: query[key], $options: "i" };
              break;
            case "in":
              acc[`tags.${key}`] = { $in: query[key].split(",") };
              break;
            default:
              acc[`tags.${key}`] = query[key];
          }
        } else {
          acc[`tags.${key}`] = query[key];
        }
      }
      return acc;
    }, {});

    console.log({ filter });
    const metrics = await Metric.find(filter);
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error); // Log error to console
    res.status(500).json({ error: "An error occurred while fetching metrics" });
  }
});

// New route for aggregation using Mongoose
router.post("/aggregate", async (req, res) => {
  try {
    const Metric = mongoose.model("Metric");
    let query
    try {
      eval(`query = ${req.body.query};`);
    } catch (err) {
      console.log("Invalid aggregate query", {
        err,
      });
      return res.status(400).json({ error: "Invalid aggregate query" });
    }
    if (!query || !Array.isArray(query)) {
      return res
        .status(400)
        .json({ error: "Invalid aggregate query (Not an array)" });
    }

    const result = await Metric.aggregate(query);

    res.json(result);
  } catch (error) {
    console.error("Error in aggregate query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
