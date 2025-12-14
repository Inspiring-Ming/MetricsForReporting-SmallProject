"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
exports.delGeneratedReport = delGeneratedReport;
const http_errors_1 = __importDefault(require("http-errors"));
const generatePDF_1 = require("./generatePDF");
const crypto_1 = __importDefault(require("crypto"));
async function generateReport(fileType, rpData) {
    const host = "http://localhost";
    const port = process.env.PORT || "3001";
    const folderName = "Testing_report";
    const id = crypto_1.default.randomUUID();
    fileType = fileType.toLocaleLowerCase();
    const fileName = `${id}.${fileType}`;
    const fileURL = `${host}:${port}/${folderName}/${fileName}`;
    rpData.generatedDate = new Date(Date.now()).toLocaleString();
    // For storage later
    // const storedData = {
    //   rpId: id,
    //   fileName: fileName,
    //   rpData: rpData,
    // };
    switch (fileType) {
        case "pdf": {
            try {
                await (0, generatePDF_1.genPDFandHTML)(rpData, fileType, id);
            }
            catch (e) {
                throw (0, http_errors_1.default)(500, "Failed in generating PDF file: ", e);
            }
            break;
        }
        case "html": {
            try {
                await (0, generatePDF_1.genPDFandHTML)(rpData, fileType, id);
            }
            catch (e) {
                throw (0, http_errors_1.default)(500, "Failed in generating PDF file: ", e);
            }
            break;
        }
        default:
            throw (0, http_errors_1.default)(400, "Invalid file type");
    }
    return { rpId: id, fileName: fileName, fileURL: fileURL };
}
function delGeneratedReport(fileName) {
    const folderName = "Testing_report";
    (0, generatePDF_1.deleteFile)(folderName, fileName);
    return {};
}
