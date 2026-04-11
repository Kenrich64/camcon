const express = require("express");
const multer = require("multer");
const { uploadCsv } = require("../controllers/uploadController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase();
    const isCsv = file.mimetype === "text/csv" || fileName.endsWith(".csv");
    const isXlsx =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx");

    if (!isCsv && !isXlsx) {
      return cb(new Error("Only .csv and .xlsx files are allowed"));
    }

    return cb(null, true);
  },
});

router.post("/csv", verifyToken, adminOnly, upload.single("file"), uploadCsv);
router.post("/", verifyToken, adminOnly, upload.single("file"), uploadCsv);

module.exports = router;