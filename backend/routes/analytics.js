const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");

// Routes
router.get("/overview", analyticsController.getOverviewStats);
router.get("/departments", analyticsController.getDepartmentDistribution);
router.get("/trend", analyticsController.getParticipationTrend);
router.get("/feedback", analyticsController.getFeedbackStats);

module.exports = router;