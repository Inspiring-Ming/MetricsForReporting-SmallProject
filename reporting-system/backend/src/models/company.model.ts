/**
 * Company related data models
 */

export interface CompanyInfo {
  industry: string;
  company_name: string;
}

export interface MetricRecord {
  PK: string;
  SK: string;
  company_name: string;
  data_type: string;
  disclosure: string;
  metric_description: string;
  metric_name: string;
  metric_unit: string;
  metric_value: string | number;
  metric_year: string;
  nb_points_of_observations: string | number;
  metric_period: string | number | null;
  provider_name: string;
  reported_date: string;
  pillar: string;
  headquarter_country: string;
  industry: string;
}
