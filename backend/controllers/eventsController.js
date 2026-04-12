const pool = require("../db");

// Get all events
const getEvents = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Get single event by ID
const getEventById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create new event
const createEvent = async (req, res, next) => {
  const { title, department, date, venue, total_students, status } = req.body;

  try {
    // Validate required fields
    if (!title || !department || !date || !venue) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      "INSERT INTO events (title, department, date, venue, total_students, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [title, department, date, venue, total_students || 0, status || "scheduled"]
    );

    const createdEvent = result.rows[0];
    const io = req.app.get("io");
    if (io) {
      io.emit("new_event", createdEvent);
    }

    res.status(201).json({
      message: "Event created ✅",
      event: createdEvent,
    });
  } catch (err) {
    next(err);
  }
};

// Update event
const updateEvent = async (req, res, next) => {
  const { id } = req.params;
  const { title, department, date, venue, total_students, status } = req.body;

  try {
    const result = await pool.query(
      "UPDATE events SET title=$1, department=$2, date=$3, venue=$4, total_students=$5, status=$6 WHERE id=$7 RETURNING *",
      [title, department, date, venue, total_students, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      message: "Event updated ✅",
      event: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Delete event
const deleteEvent = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM events WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      message: "Event deleted ✅",
      event: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
