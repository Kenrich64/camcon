const csv = require("csv-parser");
const { Readable } = require("stream");
const XLSX = require("xlsx");
const pool = require("../db");
const { createNotification } = require("./notificationsController");

const REQUIRED_FIELDS = [
  "event_name",
  "department",
  "total_students",
  "attended_students",
];

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (error) => reject(error));
  });

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
};

const normalizeRow = (rawRow = {}) => {
  const eventName = rawRow.event_name ?? rawRow.title ?? "";
  const department = rawRow.department ?? "";
  const totalStudents = rawRow.total_students ?? "";
  const attendedStudents = rawRow.attended_students ?? "";

  return {
    event_name: String(eventName).trim(),
    department: String(department).trim(),
    total_students: String(totalStudents).trim(),
    attended_students: String(attendedStudents).trim(),
  };
};

const validateRow = (row, index) => {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = row[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    return `Row ${index + 1} is missing required fields: ${missing.join(", ")}`;
  }

  const totalStudents = Number(row.total_students);
  const attendedStudents = Number(row.attended_students);

  if (Number.isNaN(totalStudents) || totalStudents < 0) {
    return `Row ${index + 1} has invalid total_students value`;
  }

  if (Number.isNaN(attendedStudents) || attendedStudents < 0) {
    return `Row ${index + 1} has invalid attended_students value`;
  }

  if (attendedStudents > totalStudents) {
    return `Row ${index + 1} attended_students cannot be greater than total_students`;
  }

  return null;
};

const ensureUploadLogsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS upload_logs (
      id SERIAL PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      total_rows INTEGER NOT NULL DEFAULT 0,
      inserted_rows INTEGER NOT NULL DEFAULT 0,
      uploaded_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

const ensureEventsAttendanceColumn = async (client) => {
  await client.query(`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS attended_students INTEGER NOT NULL DEFAULT 0
  `);
};

const uploadCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a .csv or .xlsx file" });
    }

    const isCsv = req.file.originalname.toLowerCase().endsWith(".csv");
    const rawRows = isCsv
      ? await parseCsvBuffer(req.file.buffer)
      : parseExcelBuffer(req.file.buffer);

    if (rawRows.length === 0) {
      return res.status(400).json({ error: "Uploaded file is empty" });
    }

    const rows = rawRows.map(normalizeRow);

    const invalidRows = [];
    rows.forEach((row, index) => {
      const validationError = validateRow(row, index);
      if (validationError) {
        invalidRows.push(validationError);
      }
    });

    if (invalidRows.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: invalidRows,
      });
    }

    const client = await pool.connect();
    let insertedRows = 0;

    try {
      await client.query("BEGIN");
      await ensureUploadLogsTable(client);
      await ensureEventsAttendanceColumn(client);

      // Replace existing event dataset so analytics and AI insights rely only on the latest upload.
      await client.query("DELETE FROM feedback");
      await client.query("DELETE FROM participation");
      await client.query("DELETE FROM events");

      const today = new Date().toISOString().slice(0, 10);

      for (const row of rows) {
        await client.query(
          `INSERT INTO events (title, department, date, venue, total_students, attended_students, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            row.event_name,
            row.department,
            today,
            "Imported via upload",
            Number(row.total_students),
            Number(row.attended_students),
            "scheduled",
          ]
        );

        insertedRows += 1;
      }

      await client.query(
        `INSERT INTO upload_logs (file_name, total_rows, inserted_rows)
         VALUES ($1, $2, $3)`,
        [req.file.originalname, rows.length, insertedRows]
      );

      await client.query("COMMIT");
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }

    await createNotification({
      title: "Dataset Updated",
      message: `${req.file.originalname} uploaded. Analytics now reflect the latest dataset only.`,
      type: "update",
      targetAudience: "all",
    });

    return res.status(201).json({
      message: "File processed successfully",
      totalRows: rows.length,
      insertedRows,
      skippedDuplicates: 0,
      invalidRows: 0,
    });
  } catch (error) {
    return next(error);
  }
};

const getUploadHistory = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await ensureUploadLogsTable(client);

    const result = await client.query(
      `SELECT id, file_name, total_rows, inserted_rows, uploaded_at
       FROM upload_logs
       ORDER BY uploaded_at DESC`
    );

    return res.json({ logs: result.rows });
  } catch (error) {
    return next(error);
  } finally {
    client.release();
  }
};

module.exports = { uploadCsv, getUploadHistory };