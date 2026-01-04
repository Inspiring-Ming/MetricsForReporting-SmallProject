// SAGE – System for Automated Generation of ESG

import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes";
import { errorHandler } from "./middlewares/error-handler.middleware";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const HOST = process.env.HOST || "0.0.0.0";

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Serve static files for generated reports
app.use('/Testing_report', express.static(path.join(process.cwd(), 'Testing_report')));

// All routes with error handling middleware
app.use("/", routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// ========================================================================= //
// ============================= APPLICATION =============================== //
// ========================================================================= //

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// Error handling
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`
    );
  } else if (err.code === "EACCES") {
    console.error(
      `❌ Permission denied for port ${PORT}. Try running with elevated privileges or a different port.`
    );
  } else {
    console.error("❌ Server failed to start:", err);
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  server.close(() => console.log("\nShutting down server."));
});

export default app;
