/**
 * Report Service
 * Business logic for ESG report generation
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ReportData, ReportGenerationResponse } from "../models/report.model";
import { BadRequestError, InternalServerError } from "../errors";
import { genPDFandHTML, deleteFile } from "../../code/reportGeneration/generatePDF";

export class ReportService {
  private host: string;
  private port: string;
  private folderName: string;

  constructor() {
    this.host = "http://localhost";
    this.port = process.env.PORT || "3001";
    this.folderName = "Testing_report";
  }

  /**
   * Generate ESG report (PDF or HTML)
   */
  async generateReport(fileType: string, rpData: ReportData): Promise<ReportGenerationResponse> {
    const id = crypto.randomUUID();

    fileType = fileType.toLocaleLowerCase();
    const fileName = `${id}.${fileType}`;
    const fileURL = `${this.host}:${this.port}/${this.folderName}/${fileName}`;

    rpData.generatedDate = new Date(Date.now()).toLocaleString();

    switch (fileType) {
      case "pdf":
        try {
          await genPDFandHTML(rpData, fileType, id);
        } catch (e) {
          throw new InternalServerError(
            `Failed in generating PDF file: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }
        break;

      case "html":
        try {
          await genPDFandHTML(rpData, fileType, id);
        } catch (e) {
          throw new InternalServerError(
            `Failed in generating PDF file: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }
        break;

      default:
        throw new BadRequestError("Invalid file type");
    }

    return { rpId: id, fileName: fileName, fileURL: fileURL };
  }

  /**
   * Delete generated report file
   */
  deleteReport(fileName: string): void {
    deleteFile(this.folderName, fileName);
  }
}
