// Find way to do calculation

export interface Data {
    company_Name: String,
    generatedDate: String | null,
    company_Perm_ID: String,
    Industry: String,
    Reporting_framework: String,
    Categories: Categories[],
}

export interface Categories {
    range: String,
    preresented_Value: String,
    metrics: Metric[],
}

export interface Metric {
    model: String,
    description: String,
    dataPoint: Object,
    dataSource: String,
    computationMethod: String,
}

export interface ReportGenResponse {
  rpId: String;
  fileName: String;
  fileURL: String;
};
