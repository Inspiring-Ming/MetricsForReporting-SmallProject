"use strict";
// SAGE – System for Automated Generation of ESG
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const error_handler_middleware_1 = require("./middlewares/error-handler.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "3001");
const HOST = process.env.HOST || "localhost";
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
// Serve static files for generated reports
app.use('/Testing_report', express_1.default.static(path_1.default.join(process.cwd(), 'Testing_report')));
// All routes with error handling middleware
app.use("/", routes_1.default);
// Error handling middleware (must be last)
app.use(error_handler_middleware_1.errorHandler);
// ========================================================================= //
// ============================= APPLICATION =============================== //
// ========================================================================= //
// Start server
const server = app.listen(PORT, HOST, () => {
    console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});
// Error handling
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    }
    else if (err.code === "EACCES") {
        console.error(`❌ Permission denied for port ${PORT}. Try running with elevated privileges or a different port.`);
    }
    else {
        console.error("❌ Server failed to start:", err);
    }
    process.exit(1);
});
process.on("SIGINT", () => {
    server.close(() => console.log("\nShutting down server."));
});
exports.default = app;
