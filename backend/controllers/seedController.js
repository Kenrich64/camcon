const pool = require("../db");

const SAMPLE_EVENTS = [
  { title: "AI Innovations Summit", department: "CSE", date: "2026-04-02", venue: "Main Auditorium", total_students: 220, status: "completed" },
  { title: "Cloud Native Workshop", department: "IT", date: "2026-04-05", venue: "Lab Block A", total_students: 180, status: "completed" },
  { title: "Wireless Tech Expo", department: "EXTC", date: "2026-04-08", venue: "Seminar Hall 2", total_students: 160, status: "completed" },
  { title: "Hackathon 24H", department: "CSE", date: "2026-04-10", venue: "Innovation Hub", total_students: 260, status: "completed" },
  { title: "Cybersecurity Bootcamp", department: "IT", date: "2026-04-12", venue: "Lab Block B", total_students: 200, status: "completed" },
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedSampleData = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertedEventIds = [];

    for (const event of SAMPLE_EVENTS) {
      const existing = await client.query(
        `SELECT id FROM events WHERE LOWER(title) = LOWER($1) AND date = $2 LIMIT 1`,
        [event.title, event.date]
      );

      if (existing.rows.length > 0) {
        insertedEventIds.push(existing.rows[0].id);
        continue;
      }

      const eventResult = await client.query(
        `INSERT INTO events (title, department, date, venue, total_students, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [event.title, event.department, event.date, event.venue, event.total_students, event.status]
      );

      insertedEventIds.push(eventResult.rows[0].id);
    }

    let participationRows = 0;
    let feedbackRows = 0;

    for (let index = 0; index < insertedEventIds.length; index += 1) {
      const eventId = insertedEventIds[index];
      const eventMeta = SAMPLE_EVENTS[index];
      const attendees = randomInt(Math.floor(eventMeta.total_students * 0.55), Math.floor(eventMeta.total_students * 0.9));

      await client.query("DELETE FROM participation WHERE event_id = $1", [eventId]);
      await client.query("DELETE FROM feedback WHERE event_id = $1", [eventId]);

      for (let i = 0; i < attendees; i += 1) {
        await client.query(
          `INSERT INTO participation (event_id, user_id, attended) VALUES ($1, NULL, 1)`,
          [eventId]
        );
        participationRows += 1;
      }

      const feedbackCount = randomInt(18, 42);
      for (let i = 0; i < feedbackCount; i += 1) {
        const score = (Math.round((Math.random() * 1.8 + 3.0) * 10) / 10).toFixed(1);
        const category = i % 3 === 0 ? "content" : i % 3 === 1 ? "organization" : "overall";

        await client.query(
          `INSERT INTO feedback (event_id, user_id, rating, comment, category, score)
           VALUES ($1, NULL, $2, $3, $4, $5)`,
          [eventId, score, "Sample seeded feedback", category, score]
        );
        feedbackRows += 1;
      }
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Sample data seeded successfully",
      events: insertedEventIds.length,
      participationRows,
      feedbackRows,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  seedSampleData,
};
