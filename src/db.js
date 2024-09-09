import mongoose from "mongoose";

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
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
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
MetricSchema.virtual("datetime").get(function () {
  return this.endTime;
});

// Ensure virtuals are included in JSON output
MetricSchema.set("toJSON", { virtuals: true });

const Metric = mongoose.model("Metric", MetricSchema);


const connectDb = () => {
  // Connect to MongoDB
  mongoose
    .connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
};

export default connectDb