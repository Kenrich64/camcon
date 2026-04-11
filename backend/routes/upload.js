const express = require("express");
const multer = require("multer");
const { uploadCsv } = require("../controllers/uploadController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      return cb(new Error("Only CSV files are allowed"));
    }

    return cb(null, true);
  },
});

router.post("/", verifyToken, adminOnly, upload.single("file"), uploadCsv);

module.exports = router;