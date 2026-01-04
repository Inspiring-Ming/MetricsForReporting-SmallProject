"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const router = (0, express_1.Router)();
const healthController = new health_controller_1.HealthController();
/**
 * Health Check Routes
 */
// System health check
router.get("/health", healthController.getHealth);
exports.default = router;
