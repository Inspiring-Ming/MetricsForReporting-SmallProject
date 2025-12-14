"use strict";
/**
 * Report Service
 * Business logic for ESG report generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const errors_1 = require("../errors");
const generatePDF_1 = require("../utils/generatePDF");
class ReportService {
    constructor() {
        this.host = "http://localhost";
        this.port = process.env.PORT || "3001";
        this.folderName = "Testing_report";
    }
    /**
     * Generate ESG report (PDF or HTML)
     */
    async generateReport(fileType, rpData) {
        const id = crypto_1.default.randomUUID();
        fileType = fileType.toLocaleLowerCase();
        const fileName = `${id}.${fileType}`;
        const fileURL = `${this.host}:${this.port}/${this.folderName}/${fileName}`;
        rpData.generatedDate = new Date(Date.now()).toLocaleString();
        switch (fileType) {
            case "pdf":
                try {
                    await (0, generatePDF_1.genPDFandHTML)(rpData, fileType, id);
                }
                catch (e) {
                    throw new errors_1.InternalServerError(`Failed in generating PDF file: ${e instanceof Error ? e.message : "Unknown error"}`);
                }
                break;
            case "html":
                try {
                    await (0, generatePDF_1.genPDFandHTML)(rpData, fileType, id);
                }
                catch (e) {
                    throw new errors_1.InternalServerError(`Failed in generating PDF file: ${e instanceof Error ? e.message : "Unknown error"}`);
                }
                break;
            default:
                throw new errors_1.BadRequestError("Invalid file type");
        }
        return { rpId: id, fileName: fileName, fileURL: fileURL };
    }
    /**
     * Delete generated report file
     */
    deleteReport(fileName) {
        (0, generatePDF_1.deleteFile)(this.folderName, fileName);
    }
}
exports.ReportService = ReportService;
