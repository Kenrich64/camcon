const express = require("express");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");
const { seedSampleData } = require("../controllers/seedController");

const router = express.Router();

router.post("/sample-data", verifyToken, adminOnly, seedSampleData);

module.exports = router;
