import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  if (process.env.DISABLE_USER_AUTH === "true") {
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

export const authRoutes = (app) => {
  // Routes
  app.post(
    "/api/register",
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    async (req, res) => {
      const User = mongoose.model("User");
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
    },
  );

  app.post(
    "/api/login",
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    async (req, res) => {
      if (process.env.DISABLE_USER_AUTH === "true") {
        return res.json({ token: "xx" });
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
    },
  );
};
