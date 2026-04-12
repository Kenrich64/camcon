const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const eventsRoutes = require("./routes/events");
const analyticsRoutes = require("./routes/analytics");
const feedbackRoutes = require("./routes/feedback");
const predictionsRoutes = require("./routes/predictions");
const uploadRoutes = require("./routes/upload");
const aiRoutes = require("./routes/ai");
const seedRoutes = require("./routes/seed");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked for this origin"));
    },
  })
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Camcon Backend Running 🚀");
});

// API Routes
app.use("/auth", authRoutes);
app.use("/events", eventsRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/predictions", predictionsRoutes);
app.use("/upload", uploadRoutes);
app.use("/ai", aiRoutes);
app.use("/seed", seedRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});