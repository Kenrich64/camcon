const csv = require("csv-parser");
const { Readable } = require("stream");
const pool = require("../db");

const REQUIRED_EVENT_FIELDS = [
  "title",
  "department",
  "date",
  "venue",
  "total_students",
  "status",
];

const REQUIRED_PARTICIPATION_FIELDS = ["event_id", "user_id", "attended"];

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (error) => reject(error));
  });

const validateRow = (row, index, requiredFields) => {
  const missing = requiredFields.filter((field) => {
    const value = row[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    return `Row ${index + 1} is missing required fields: ${missing.join(", ")}`;
  }

  return null;
};

const uploadCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a CSV file" });
    }

    const rows = await parseCsvBuffer(req.file.buffer);
    if (rows.length === 0) {
      return res.status(400).json({ error: "CSV file is empty" });
    }

    const target = String(req.query.target || "events").toLowerCase();
    if (target !== "events" && target !== "participation") {
      return res.status(400).json({ error: "Invalid target. Use events or participation" });
    }

    for (let index = 0; index < rows.length; index += 1) {
      const requiredFields = target === "events" ? REQUIRED_EVENT_FIELDS : REQUIRED_PARTICIPATION_FIELDS;
      const validationError = validateRow(rows[index], index, requiredFields);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      if (target === "events" && Number.isNaN(Number(rows[index].total_students))) {
        return res.status(400).json({ error: `Row ${index + 1} has invalid total_students value` });
      }

      if (target === "participation") {
        if (Number.isNaN(Number(rows[index].event_id)) || Number.isNaN(Number(rows[index].user_id))) {
          return res.status(400).json({ error: `Row ${index + 1} has invalid event_id or user_id` });
        }

        const attendedValue = String(rows[index].attended).trim().toLowerCase();
        const validAttendedValues = ["1", "0", "true", "false", "yes", "no"];
        if (!validAttendedValues.includes(attendedValue)) {
          return res.status(400).json({ error: `Row ${index + 1} has invalid attended value` });
        }
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const row of rows) {
        if (target === "events") {
          await client.query(
            `INSERT INTO events (title, department, date, venue, total_students, status)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              String(row.title).trim(),
              String(row.department).trim(),
              row.date,
              String(row.venue).trim(),
              Number(row.total_students),
              String(row.status).trim(),
            ]
          );
        } else {
          const attendedValue = String(row.attended).trim().toLowerCase();
          const attended = ["1", "true", "yes"].includes(attendedValue) ? 1 : 0;

          await client.query(
            `INSERT INTO participation (event_id, user_id, attended)
             VALUES ($1, $2, $3)`,
            [Number(row.event_id), Number(row.user_id), attended]
          );
        }
      }

      await client.query("COMMIT");
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }

    return res.status(201).json({
      message: "CSV uploaded successfully",
      insertedRows: rows.length,
      target,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { uploadCsv };