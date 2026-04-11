const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const authMiddleware = require("../middleware/auth");

router.post("/submit-application", authMiddleware, applicationController.submitApplication);

module.exports = router;