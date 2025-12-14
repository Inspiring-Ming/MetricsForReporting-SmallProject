import HTTPError from "http-errors";
import { Data, ReportGenResponse } from "./interface";
import { genPDFandHTML, deleteFile } from "./generatePDF";
import crypto from "crypto";

async function generateReport(fileType: string, rpData: Data): Promise<ReportGenResponse> {
  const host = "http://localhost";
  const port = process.env.PORT || "3001";
  const folderName = "Testing_report";
  const id = crypto.randomUUID();

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
      await genPDFandHTML(rpData, fileType, id);
    } catch (e) {
      throw HTTPError(500, "Failed in generating PDF file: ", e);
    }
    break;
  }

  case "html": {
    try {
      await genPDFandHTML(rpData, fileType, id);
    } catch (e) {
      throw HTTPError(500, "Failed in generating PDF file: ", e);
    }
    break;
  }

  default:
    throw HTTPError(400, "Invalid file type");
  }

  return { rpId: id, fileName: fileName, fileURL: fileURL };

}

function delGeneratedReport(fileName: string) {
  const folderName = "Testing_report";
  deleteFile(folderName, fileName);

  return {};
}

export { generateReport, delGeneratedReport };