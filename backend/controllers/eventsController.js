const pool = require("../db");
const { createNotification } = require("./notificationsController");

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
    await createNotification({
      title: "Event Update",
      message: `${createdEvent.title} has been created`,
      type: "new",
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("new_event", createdEvent);
      io.emit("event_update", {
        type: "created",
        event: createdEvent,
        message: `Event Update: ${createdEvent.title} has been created`,
      });
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
  const { department, date, venue, status } = req.body;

  try {
    // Get the old event first to determine update type
    const oldEventResult = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );

    if (oldEventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const oldEvent = oldEventResult.rows[0];

    const nextDepartment = department ?? oldEvent.department;
    const nextDate = date ?? oldEvent.date;
    const nextVenue = venue ?? oldEvent.venue;
    const nextStatus = status ?? oldEvent.status;

    const allowedStatuses = ["scheduled", "cancelled", "postponed", "ongoing", "completed"];
    if (!allowedStatuses.includes(String(nextStatus))) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const result = await pool.query(
      "UPDATE events SET department=$1, date=$2, venue=$3, status=$4 WHERE id=$5 RETURNING *",
      [nextDepartment, nextDate, nextVenue, nextStatus, id]
    );

    const updatedEvent = result.rows[0];

    // Determine update type based on what changed
    let updateType = "updated";
    if (nextStatus === "cancelled" && oldEvent.status !== "cancelled") {
      updateType = "cancelled";
    } else if (nextStatus === "postponed" || oldEvent.date !== nextDate) {
      updateType = "postponed";
    } else if (oldEvent.venue !== nextVenue) {
      updateType = "venue_changed";
    } else if (oldEvent.status !== nextStatus) {
      updateType = "updated";
    }

    // Emit socket notification
    if (["cancelled", "postponed", "venue_changed", "updated"].includes(updateType)) {
      const statusText =
        updateType === "venue_changed"
          ? "venue has changed"
          : `has been ${updateType}`;

      await createNotification({
        title: "Event Update",
        message: `${updatedEvent.title} ${statusText}`,
        type: "update",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("event_update", {
        type: updateType,
        event: updatedEvent,
        message: `Event Update: ${updatedEvent.title} has been ${updateType}`,
      });
    }

    res.json({
      message: "Event updated ✅",
      event: updatedEvent,
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

    const deletedEvent = result.rows[0];

    await createNotification({
      title: "Event Update",
      message: `${deletedEvent.title} has been cancelled`,
      type: "update",
    });

    // Emit socket notification for cancelled event
    const io = req.app.get("io");
    if (io) {
      io.emit("event_update", {
        type: "cancelled",
        event: deletedEvent,
        message: `Event Update: ${deletedEvent.title} has been cancelled`,
      });
    }

    res.json({
      message: "Event deleted ✅",
      event: deletedEvent,
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
