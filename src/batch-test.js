import mongoose from 'mongoose';
import dotenv from "dotenv";
import { createMetric } from './routes/metrics.js';
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import connectDb from "./db.js";
import path from "path";

connectDb()

// Flag to simulate MongoDB being faster than MySQL
const fakeBetterMongoStats = true;

// Templates for custom tags
const templates = [
  { clientName: 'DGD', dataOrigin:'mongo', loginName:'jarancibia', userId:"15463" },
  { clientName: 'Paprec', dataOrigin:'mongo', loginName:'jarancibia',userId:"15463" },
  { clientName: 'Paprec',dataOrigin:'mysql', loginName:'jarancibia',userId:"15463" },
];

// Configuration
const config = {
  numberOfEvents: 200,
  startDate: new Date('2024-08-01'),
  endDate: new Date('2024-08-31'),
  minDuration: 5,  // in seconds
  maxDuration: 10,  // in seconds
};

// Function to generate a random date between start and end
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to generate random duration based on data origin
function randomDuration(min, max, dataOrigin) {
  if (fakeBetterMongoStats) {
    if (dataOrigin === 'mongo') {
      // For MongoDB, generate durations in the lower end
      return Math.floor(Math.random() * (min + (max - min) / 2 - min + 1) + min);
    } else if (dataOrigin === 'mysql') {
      // For MySQL, generate durations in the higher end
      return Math.floor(Math.random() * (max - (min + (max - min) / 2) + 1) + (min + (max - min) / 2));
    }
  }
  // If fakeBetterMongoStats is false or for any other data origin, use the original logic
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to get a random template
function getRandomTemplate() {
  return templates[Math.floor(Math.random() * templates.length)];
}

// Main function to generate and insert batch events
async function generateBatchEvents() {
  const Project = mongoose.model('Project');
  const project = await Project.findOne({ name: 'test' }); // Assuming you have at least one project in the database

  if (!project) {
    console.error('No project found in the database');
    return;
  }

  const Metric = mongoose.model('Metric'); // Assuming you have a Metric model
  const bulkOps = [];

  for (let i = 0; i < config.numberOfEvents; i++) {
    const template = getRandomTemplate();
    const startTime = randomDate(config.startDate, config.endDate);
    const duration = randomDuration(config.minDuration, config.maxDuration, template.dataOrigin);
    const endTime = new Date(startTime.getTime() + duration * 1000);

    const metricData = {
      project: project._id,
      operation: [
        'location_realtime',
        'location_history',
        'events',
        'messages',
        'alerts',
        'diagnostics'
      ][Math.floor(Math.random() * 6)],

      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: duration,
      tags: {
        ...template,
        batchTestId: `batch_${i + 1}`,
      },
    };

    bulkOps.push({
      insertOne: {
        document: metricData,
      },
    });
  }

  try {
    const bulkWriteResult = await Metric.bulkWrite(bulkOps);
    console.log(`Inserted ${bulkWriteResult.insertedCount} metrics`);
  } catch (error) {
    console.error('Error inserting metrics:', error);
  }

  console.log('Batch insertion completed');
  mongoose.disconnect();
}


generateBatchEvents();