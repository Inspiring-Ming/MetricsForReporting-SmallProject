"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
/**
 * Health Controller
 * Handles system health check endpoints
 */
class HealthController {
    constructor() {
        /**
         * GET /health
         * System health check
         */
        this.getHealth = (req, res) => {
            res.status(200).json({ status: "ok" });
        };
    }
}
exports.HealthController = HealthController;
