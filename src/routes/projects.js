import mongoose from "mongoose";
import {authenticateToken} from '../auth.js'
import { body, validationResult } from "express-validator";

export default (app) => {
  app.post(
    "/api/projects",
    authenticateToken,
    body("name").isString().notEmpty(),
    async (req, res) => {
      const Project = mongoose.model("Project");
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const project = new Project({
          name: req.body.name,
          apiKey: Math.random().toString(36).substring(7),
          user: req?.user?.id,
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
    },
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
        if (req?.user?.id && project.user.toString() !== req.user.id) {
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
    },
  );

  app.get("/api/projects", authenticateToken, async (req, res) => {
    try {
      const Project = mongoose.model("Project");
      const projects = req?.user?.id
        ? await Project.find({ user: req?.user?.id })
        : await Project.find({});
      res.json(projects);
    } catch (error) {
      console.log({ error });
      res
        .status(500)
        .json({ error: "An error occurred while fetching projects" });
    }
  });
};
