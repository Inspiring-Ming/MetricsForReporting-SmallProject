import { genReportReq, delGeneratedReportReq } from "../utils/callout";
import { Data } from "../rp_gen/interface";

const mockData: Data = {
  company_Name: "GreenFuture Inc.",
  generatedDate: new Date(Date.now()).toLocaleString(),
  company_Perm_ID: "ESG-12345",
  Industry: "Renewable Energy",
  Reporting_framework: "GRI",
  Categories: [
    {
      range: "2 years",
      preresented_Value: "2000",
      metrics: [
        {
          model: "GHG Emissions Model",
          description: "GHG Emissions Des",
          dataPoint: {
            scope1: 1200.5,
            scope2: 980.3,
            scope3: 4500.0,
            unit: "metric tons CO2e"
          },
          dataSource: "Internal ESG Department",
          computationMethod: "ISO 14064"
        },
        {
          model: "Energy Consumption Model",
          description: "Energy Consumption Des",
          dataPoint: {
            renewable: 320000,
            nonRenewable: 480000,
            unit: "kWh"
          },
          dataSource: "Energy Logs",
          computationMethod: "Direct Metering"
        }
      ]
    },
    {
      range: "2 years",
      preresented_Value: "3453",
      metrics: [
        {
          model: "Water Usage",
          description: "Water Usage Des",
          dataPoint: {
            total: 1500000,
            unit: "liters"
          },
          dataSource: "Water Utility Bills",
          computationMethod: "Meter Reading"
        },
        {
          model: "Diversity Metrics",
          description: "Diversity Metrics Des",
          dataPoint: {
            femalePercentage: 45.3,
            minorityPercentage: 38.2
          },
          dataSource: "HR Reports",
          computationMethod: "Statistical Survey"
        }
      ]
    }
  ]
};

let FILE_NAME: string;

// Return object when successfully generated a ESG report file
const reportReturnData = {
  rpId: expect.any(String),
  fileName: expect.any(String),
  fileURL: expect.any(String)
};

describe("/SAGE/report/generate: ", () => {
  describe("Success Cases", () => {
    test("Success Generated a file with all cap file type", async () => {
      const response = await genReportReq("PDF", mockData);
      FILE_NAME = response.fileName as string;
      expect(response).toStrictEqual(reportReturnData);
    });
  });
});


describe("/SAGE/report/file/delete: ", () => {
  describe("Success Cases", () => {
    test("Success Delete the generated report on server", async () => {
      const response = await delGeneratedReportReq(FILE_NAME);
      expect(response).toStrictEqual({});
    });
  });
});
