import express from "express";
// import serverless from "serverless-http";
import errorHandler from "middleware-http-errors";
import cors from "cors";
import morgan from "morgan";
import config from "./config.json";

import { generateReport, delGeneratedReport } from "./rp_gen/reportGen";
import { handleHttpError } from "./utils/helper";

const app = express();
const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || "localhost";


// Use middleware that allows us to access the JSON body of requests
app.use(express.json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan("dev"));
// for error handling
app.use(errorHandler());

// ========================================================================= //
// =============================== SYSTEM ================================== //
// ========================================================================= //

// SAGE – System for Automated Generation of ESG

app.get("/SAGE/echo", (req, res) => {
  res.send("SAGE API is running😍😍");
});

// ========================================================================= //
// =========================== REPORT FUNCTIONS ============================ //
// ========================================================================= //

// ➕ POST: Generate new ESG Report
app.post("/SAGE/report/generate", async (req, res) => {
  const { fileType, data } = req.body;
  try {
    const result = await generateReport(fileType, data);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// ❌ DELETE: Delete generated Report file by file name - Internal Use
app.delete("/SAGE/report/file/delete", (req, res) => {
  const fileName = req.query.fileName as string;

  try {
    const result = delGeneratedReport(fileName);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// ========================================================================= //

// extract root for generated report
app.use("/Testing_report", express.static("Testing_report"));

// ========================================================================= //
// ============================= APPLICATION =============================== //
// ========================================================================= //

// For serverless if deploying on lambda
// export const handler = serverless(app);

// start server
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡️ Report Server started on port ${PORT} at ${HOST}`);
});

process.on("SIGINT", () => {
  server.close(() => console.log("\nShutting down server."));
});
