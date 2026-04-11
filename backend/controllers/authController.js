const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// Register user
const register = async (req, res, next) => {
  const { email, password, name, role, adminKey } = req.body;

  try {
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const wantsAdmin = role === "admin";
    const canCreateAdmin =
      wantsAdmin &&
      process.env.ADMIN_CREATION_KEY &&
      adminKey === process.env.ADMIN_CREATION_KEY;
    const assignedRole = canCreateAdmin ? "admin" : "user";

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
      [email, hashedPassword, name, assignedRole]
    );

    res.status(201).json({
      message: "User registered ✅",
      user: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Login user
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
