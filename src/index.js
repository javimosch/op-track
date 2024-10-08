
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import basicAuth from "express-basic-auth";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import configureProjectApiRoutes from "./routes/projects.js";
import metricsRoutes from "./routes/metrics.js";
import {authenticateToken} from './auth.js'
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import connectDb from "./db.js";
import configureAiApiRoutes from "./ai.js";

import { startSignoz } from "./signoz.js";

if(process.env.SIGNOZ_ENABLED==='1'){
  startSignoz()
}

connectDb()

const swaggerDocument = JSON.parse(
  fs.readFileSync(new URL("./swagger.json", import.meta.url)),
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function setupBasicAuth() {
  return basicAuth({
    users: {
      [process.env.BASIC_AUTH_USER || "admin"]:
        process.env.BASIC_AUTH_PASSWORD || "secret",
    },
    challenge: true,
    unauthorizedResponse: "Unauthorized",
  });
}

function setupMiddleware(app) {
  
  app.use(cors());
  app.use(express.json());
}

function setupSwagger(app, basicAuthMiddleware) {
  app.use(
    "/api-docs",
    basicAuthMiddleware,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument),
  );
}

function setupStaticFiles(app) {
  app.use(express.static(path.join(__dirname, "./client/dist")));
}

function setupRoutes(app, basicAuthMiddleware) {

  app.use("/api/metrics", metricsRoutes);

  //authRoutes(app);


  app.use('/api', authenticateToken)
  configureProjectApiRoutes(app)
  configureAiApiRoutes(app)

  app.get("/client", basicAuthMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, "./client.html"));
  });
  app.get("/", basicAuthMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, "./client/dist/index.html"));
  });
}

function setupErrorHandler(app) {
  app.use((err, req, res, next) => {
    console.error("Global Error Handler: ", err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  });
}

const basicAuthMiddleware = setupBasicAuth();
setupMiddleware(app);
setupSwagger(app, basicAuthMiddleware);

setupRoutes(app, basicAuthMiddleware);
setupStaticFiles(app);
setupErrorHandler(app);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
