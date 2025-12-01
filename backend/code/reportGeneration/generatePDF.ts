import puppeteer from "puppeteer";
import fs from "fs";
import { Data } from "./interface";
import path from "path";
import HTTPError from "http-errors";

// Function to ensure folder exists
function isFolder(folderName: string) {
  const folderPath = path.join(process.cwd(), folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
  return folderPath;
}
// Capitalize at index letter in str
function capitalizeAt(str: string, index: number): string {
  // Ensure index between the str length
  if (index < 0 || index >= str.length) return str;
  return (
    str.slice(0, index) +
    str.charAt(index).toUpperCase() +
    str.slice(index + 1)
  );
}


// Function to check for atribute format
function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return `<ul>${value.map(v => `<li>${formatValue(v)}</li>`).join("")}</ul>`;
  } else if (typeof value === "object" && value !== null) {
    return `
      <table class="nested-table">
        ${Object.entries(value).map(
    ([k, v]) => `
            <tr>
              <td class="key">${k}:</td>
              <td class="value">${formatValue(v)}</td>
            </tr>
          `
  ).join("")}
      </table>
    `;
  } else {
    return String(value);
  }
}

function generateHtml(data: any): string {
  const specialHeaders = new Set(["environmental", "social", "governance"]);
  return `
    <html>
      <head>
        <title>ESG Testing Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
            background: #f9f9f9;
          }

          h1 {
            text-align: center;
            margin-bottom: 40px;
          }

          .line {
            padding: 8px 12px;
            margin-bottom: 6px;
            border-left: 4px solid #ccc;
            background-color: #fff;
          }

          .key {
            font-weight: bold;
            color: #2c3e50;
          }

          .value {
            color: #333;
          }

          ul {
            margin: 5px 0;
            padding-left: 20px;
          }

          table.nested-table {
            border-collapse: collapse;
            margin: 5px 0;
          }

          table.nested-table td {
            padding: 4px 8px;
            vertical-align: top;
          }

          table.nested-table td.key {
            font-weight: bold;
            color: #2c3e50;
            min-width: 160px;
            white-space: nowrap;
          }

          .section-break {
            page-break-after: always;
            break-after: page;
            margin-top: 40px;
          }

          .section-break:last-child {
            page-break-after: auto;
          }
        </style>
      </head>
      <body>
        <h1>ESG Testing Report</h1>
        ${Object.entries(data).map(([key, value]) => {
    if (specialHeaders.has(key.toLowerCase())) {
      return `
          <div class="line">
            <div><h1 class="key">${capitalizeAt(key, 0)}:</h1></div>
            ${formatValue(value)}
          </div>
        `;
    } else {
      return `
          <div class="line">
            <div><span class="key">${key}:</span></div>
            ${formatValue(value)}
          </div>
        `;
    }
  }).join("")}
      </body>
    </html>
  `;
}

async function genPDFandHTML(data: Data, fileType: string, id: string) {
  const folderPath = isFolder("Testing_report");

  switch (fileType.toLocaleLowerCase()) {
  case "pdf": {
    const filePath = path.join(folderPath, `${id}.pdf`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const html = generateHtml(data);
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();
    console.log(`✅ PDF created: ${filePath}`);
    break;
  }

  case "html": {
    const filePath = path.join(folderPath, `${id}.html`);
    const html = generateHtml(data);
    try {
      fs.writeFileSync(filePath, html);
      console.log(`✅ HTML created: ${filePath}`);
    } catch (e) {
      console.error(e);
    }
    break;
  }

  default:
    console.log("Unsupported file type");
    break;
  }
};

function deleteFile(folderName: string, fileName: string) {
  const folderPath = path.join(process.cwd(), folderName);
  if (!fs.existsSync(folderPath)) {
    throw HTTPError(400, "Invalid Folder Path");
  }

  const filePath = path.join(folderPath, fileName);
  if (!fs.existsSync(filePath)) {
    throw HTTPError(400, "Invalid File Name");
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      throw HTTPError(500, `Failed removing file: ${err}`);
    }

    console.log(`File ${filePath} has been successfully removed.`);
  });
}

export { genPDFandHTML, deleteFile };

// ========================================================================= //
// ============================ EXAMPLE USUAGE ============================= //
// ========================================================================= //
// const data = {
//   "companyId": "ESG-12345",
//   "companyName": "GreenFuture Inc.",
//   "reportingYear": 2024,
//   "environmental": {
//     "ghgEmissions": {
//       "scope1": 1200.5,
//       "scope2": 980.3,
//       "scope3": 4500.0,
//       "unit": "metric tons CO2e"
//     },
//     "energyConsumption": {
//       "renewable": 320000,
//       "nonRenewable": 480000,
//       "unit": "kWh"
//     },
//     "waterUsage": {
//       "total": 1500000,
//       "unit": "liters"
//     },
//     "wasteGenerated": {
//       "hazardous": 50.2,
//       "nonHazardous": 420.7,
//       "unit": "metric tons"
//     }
//   },
//   "social": {
//     "employeeCount": 1200,
//     "diversity": {
//       "femalePercentage": 45.3,
//       "minorityPercentage": 38.2
//     },
//     "trainingHours": {
//       "averagePerEmployee": 15.5
//     },
//     "incidents": {
//       "workplaceInjuries": 3,
//       "fatalities": 0
//     }
//   },
//   "governance": {
//     "boardComposition": {
//       "totalMembers": 10,
//       "independentMembers": 6,
//       "femaleMembers": 4
//     },
//     "antiCorruptionPolicy": true,
//     "executiveCompensationLinkedToESG": true,
//     "dataPrivacyIncidents": 0
//   }
// };

// genPDFandHTML(data, "HTML");