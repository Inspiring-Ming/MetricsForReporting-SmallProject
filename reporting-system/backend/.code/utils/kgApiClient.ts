import HTTPError from "http-errors";

/**
 * ESG Knowledge Graph Platform API Client
 * 
 * This client communicates with the esg-kg-platform backend API
 * to query the knowledge graph instead of directly querying GraphDB.
 */

const KG_API_BASE_URL = process.env.KG_API_URL || "http://localhost:3000/api/kg";

/**
 * Fetch helper with error handling
 */
async function fetchKGApi(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw HTTPError(
        response.status,
        errorData.error?.message || `KG API request failed: ${response.statusText}`
      );
    }
    
    return await response.json();
  } catch (error: any) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error; // Re-throw HTTPError
    }
    throw HTTPError(500, `Failed to connect to KG API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get metric calculation method details
 * Used by modelExecutaion to fetch metric metadata
 * 
 * @param metric - The metric identifier (label or IRI)
 * @returns Calculation method details including data sources or model information
 */
export async function getMetricCalculationMethod(metric: string): Promise<any> {
  const encodedMetric = encodeURIComponent(metric);
  const url = `${KG_API_BASE_URL}/metrics/${encodedMetric}/calculation-method`;
  
  try {
    return await fetchKGApi(url);
  } catch (error) {
    throw HTTPError(500, `Failed to get calculation method for ${metric}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

