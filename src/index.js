import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import swaggerUi from "swagger-ui-express";
import { body, validationResult } from "express-validator";
import path from "path";
import { fileURLToPath } from "url";
import basicAuth from "express-basic-auth"; // Import basic auth library

// Import swagger.json with assertion
import fs from "fs";

const swaggerDocument = JSON.parse(fs.readFileSync(new URL("./swagger.json", import.meta.url)));

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cors from "cors";
const app = express();

// Set up basic authentication
const basicAuthMiddleware = basicAuth({
  users: { [process.env.BASIC_AUTH_USER || 'admin']: process.env.BASIC_AUTH_PASSWORD || 'secret' }, // Fallback to predefined user and password
  challenge: true,
  unauthorizedResponse: 'Unauthorized'
})
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// User model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// Project model
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Project = mongoose.model("Project", ProjectSchema);

// Metric model
const MetricSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  operation: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  tags: Object,
});

// Add a virtual property for datetime using endTime
MetricSchema.virtual('datetime').get(function() {
  return this.endTime;
});

// Ensure virtuals are included in JSON output
MetricSchema.set('toJSON', { virtuals: true });

const Metric = mongoose.model("Metric", MetricSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  if (process.env.DISABLE_USER_AUTH === 'true') {
    return next(); // Skip authentication if disabled
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null)
    return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Routes
app.post(
  "/api/register",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log("Hashing password for user:", req.body.email); // Log before hashing
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      console.log("Password hashed successfully."); // Log after hashing
      const user = new User({
        email: req.body.email,
        password: hashedPassword,
      });
      console.log("Saving user to the database:", user); // Log before saving
      await user.save();
      console.log("User saved successfully."); // Log after saving
      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ error: "Email already in use" });
      } else {
        res
          .status(500)
          .json({ error: "An error occurred during registration" });
      }
    }
  }
);

app.post(
  "/api/login",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {

    if(process.env.DISABLE_USER_AUTH === 'true') {
      return res.json({ token:'xx' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log(`User lookup for email: ${req.body.email}`); // Log email lookup
      const user = await User.findOne({ email: req.body.email });
      console.log(`Comparing password for user: ${user._id}`); // Log email lookup
      if (user && (await bcrypt.compare(req.body.password, user.password))) {
        console.log(`User authenticated: ${user._id}`); // Log successful authentication
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token });
      } else {
        console.log(`Authentication failed for email: ${req.body.email}`); // Log failed authentication
        res.status(400).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "An error occurred during login" });
    }
  }
);

app.post(
  "/api/projects",
  authenticateToken,
  body("name").isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const project = new Project({
        name: req.body.name,
        apiKey: Math.random().toString(36).substring(7),
        user: req.user.id,
      });
      await project.save();
      res.status(201).json(project);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ error: "Project name already in use" });
      } else {
        res
          .status(500)
          .json({ error: "An error occurred while creating the project" });
      }
    }
  }
);

app.post(
  "/api/projects/:id/generate-api-key",
  authenticateToken,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.user.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      project.apiKey = Math.random().toString(36).substring(7);
      await project.save();
      res.json({ apiKey: project.apiKey });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while generating the API key" });
    }
  }
);

app.post(
  "/api/metrics",
  body("operation").isString().notEmpty(),
  body("startTime").isISO8601(),
  body("endTime").isISO8601(),
  body("duration").isNumeric(),
  body("tags").isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const project = await Project.findOne({
        apiKey: req.headers["x-api-key"],
      });
      if (!project) return res.status(401).json({ error: "Invalid API key" });

      const metric = new Metric({
        project: project._id,
        operation: req.body.operation,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        duration: req.body.duration,
        tags: req.body.tags,
      });
      await metric.save();
      res.status(201).json({ message: "Metric saved successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while saving the metric" });
    }
  }
);

app.get("/api/metrics/export", authenticateToken, async (req, res) => {
  try {
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
    const csv = metrics.map(metric => ({
      operation: metric.operation,
      startTime: metric.startTime,
      endTime: metric.endTime,
      duration: metric.duration,
      tags: JSON.stringify(metric.tags),
    }));

   // Create TSV string with line breaks for Excel/LibreOffice compatibility
const tsvString = [
  ["Operation", "Start Time", "End Time", "Duration", "Tags"],
  ...csv.map(row => [
    row.operation,
    row.startTime,
    row.endTime,
    row.duration,
    // Convert tags object to a string, replace commas, and trim whitespace
    row.tags ? JSON.stringify(row.tags).replace(/,/g, ";").trim() : ""
  ])
].map(e => e.join("\t")).join("\r\n"); // Use \t for tab separation and \r\n for line breaks

    // Set headers for download
    res.header("Content-Type", "text/csv");
    res.attachment("metrics.csv");
    res.send(tsvString);
  } catch (error) {
    console.error("Error exporting metrics:", error);
    res.status(500).json({ error: "An error occurred while exporting metrics" });
  }
});


app.get("/api/metrics", authenticateToken, async (req, res) => {
  try {
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

    const validFields = [
      "operation",
      "startTime",
      "endTime",
      "duration",
      "project",
    ]; // Define valid fields for the query
    const filter = Object.keys(query).reduce((acc, key) => {
      if (validFields.includes(key)) {
        acc[key] = query[key];
      } else if (query[key] !== "") {
        // Directly assign the tag as a key-value pair
        acc[`tags.${key}`] = query[key];
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

app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id });
    res.json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching projects" });
  }
});

// Swagger setup
app.use("/api-docs", basicAuthMiddleware,swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve static files from the React app

app.use(express.static(path.join(__dirname, "./client/dist")));

app.get("/client",basicAuthMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "./client.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler: ", err.stack); // Log the error stack with a message
  res.status(500).json({ error: "Something went wrong!" }); // Send a generic error response
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", basicAuthMiddleware,(req, res) => {
  res.sendFile(path.join(__dirname, "./client/dist/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
