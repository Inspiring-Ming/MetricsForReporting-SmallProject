"use strict";
/**
 * Computation Routes
 * Routes for metric computation and model execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const computation_controller_1 = require("../controllers/computation.controller");
const router = (0, express_1.Router)();
const computationController = new computation_controller_1.ComputationController();
/**
 * POST /SAGE/model/computation
 * Execute model computation with given metrics
 *
 * Request body:
 * - perm_id: string - Company permanent ID
 * - calculation_type: string - Type of calculation/model to execute
 * - year: string - Year for metric data
 * - metricArray: string[] - Array of metric names to compute
 */
router.post("/computation", computationController.executeModel);
exports.default = router;
