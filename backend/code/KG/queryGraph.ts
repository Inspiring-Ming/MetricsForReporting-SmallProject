import HTTPError from "http-errors";
import { wrapError } from "../utils/generalHelper";
import dotenv from "dotenv";
dotenv.config();

// GraphDB Configuration
const GRAPHDB_BASE_URL = process.env.GRAPHDB_URL || "https://abcxyz123456.xyz";
const REPOSITORY_ID = process.env.GRAPHDB_REPOSITORY || "esg-knowledge-graph";
const GRAPHDB_ENDPOINT = `${GRAPHDB_BASE_URL}/repositories/${REPOSITORY_ID}`;

// Global KG's Prefix
const ESG = "PREFIX esg: <http://example.org/esg#>";
const RDFS = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>";

// GraphDB SPARQL Query Function
async function executeSparqlQuery(query: string): Promise<any> {
  try {
    const response = await fetch(GRAPHDB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        "Accept": "application/sparql-results+json"
      },
      body: query
    });

    if (!response.ok) {
      throw new Error(`GraphDB query failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw HTTPError(500, `GraphDB query failed: ${error}`);
  }
}

async function getReportFramework(industry: string) {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?frameworkLabel WHERE {
      ?industry a esg:Industry ;
                rdfs:label "${industry}" ;
                esg:reportsUsing ?framework .

      ?framework a esg:ReportingFramework ;
                 rdfs:label ?frameworkLabel ;
    }
    ORDER BY ?frameworkLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const res: string[] = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.frameworkLabel && binding.frameworkLabel.value) {
          res.push(binding.frameworkLabel.value);
        }
      }
    }

    return { result: res };
  } catch (error) {
    throw HTTPError(500, `Failed to get report framework for industry ${industry}`);
  }
}

/**
 * CQ3: What Categories are included within the [reporting framework]?
 *
 * @param {string} industry
 * @param {string} framework
 * @returns { Promise<{ categoryUri: string; categoryLabel: string }[]> }
 */
async function getCategoriesByIndustryAndReportFramework(
  industry: string,
  framework: string
): Promise<{ result: string[] }>
{
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?category ?categoryLabel WHERE {
      ?industry a esg:Industry ;
                rdfs:label "${industry}" ;
                esg:reportsUsing ?framework .

      ?framework a esg:ReportingFramework ;
                 rdfs:label "${framework}" ;
                 esg:includes ?category .
      ?category a esg:Category ;
                rdfs:label ?categoryLabel .
    }
    ORDER BY ?categoryLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const res: string[] = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.categoryLabel && binding.categoryLabel.value) {
          res.push(binding.categoryLabel.value);
        }
      }
    }

    return { result: res };
  } catch (error) {
    throw HTTPError(500, `Failed to get categories for industry ${industry} and framework ${framework}`);
  }
}

/**
 * CQ4: Which Metrics are classified under [specific category]?
 *
 * @param industry
 * @param categoryLabel
 * @returns {Promise<{ metricUri: string; metricLabel: string }[]>}
 */
async function getMetricsByIndustryAndCategory(
  industry: string,
  categoryLabel: string,
  framework: string
): Promise<{ result: string[] }>
{

  // SPARQL query with parameterized category
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?metric ?metricLabel WHERE {
      ?industry a esg:Industry ;
                rdfs:label "${industry}" ;
                esg:reportsUsing ?framework .

      ?framework a esg:ReportingFramework ;
                 rdfs:label "${framework}" ;
                 esg:includes ?category .

      ?category a esg:Category ;
                rdfs:label "${categoryLabel}" ;
                esg:consistsOf ?metric .

      ?metric a esg:Metric ;
              rdfs:label ?metricLabel .
    }
    ORDER BY ?metricLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const res: string[] = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.metricLabel && binding.metricLabel.value) {
          res.push(binding.metricLabel.value);
        }
      }
    }

    return { result: res };
  } catch (error) {
    throw HTTPError(500, `Failed to get metrics for industry ${industry}, category ${categoryLabel}, framework ${framework}`);
  }
}

// Helper function to convert GraphDB bindings to Map
function createDataMapFromGraphDB(bindings: any[]): Map<string, string> {
  const dataMap = new Map<string, string>();

  bindings.forEach(binding => {
    const p = binding.p?.value;
    const o = binding.o?.value;

    if (p && o) {
      // Get rid of IRIs
      const predicate = removeIRI(p);
      const object = removeIRI(o);

      // Add more object if predicate already exist
      if (dataMap.has(predicate)) {
        const current = dataMap.get(predicate)!;
        dataMap.set(predicate, `${current}, ${object}`);
      } else {
        dataMap.set(predicate, object);
      }
    }
  });

  return dataMap;
}

/**
 * Get all the metric's atributes
 *
 * @param metric_label
 * @returns
 */
async function getMetricAtributes(metric_label: string)
: Promise<Map<string, string>>
{
  const query = `
    ${ESG}
    ${RDFS}
    SELECT ?p ?o WHERE {
      ?metric a esg:Metric ;
              rdfs:label "${metric_label}" ;
              ?p ?o .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);
    
    if (result.results && result.results.bindings) {
      return createDataMapFromGraphDB(result.results.bindings);
    }
    
    return new Map<string, string>();
  } catch (error) {
    throw HTTPError(500, `Failed to get attributes for metric ${metric_label}`);
  }
}

// CQ8: What are the historical Values of [specific datapoint]?
async function getDataPointAtribute(metric: string)
: Promise<Map<string, string>>
{
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?p ?o WHERE {
          esg:${metric} ?p ?o .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);
    
    if (result.results && result.results.bindings) {
      return createDataMapFromGraphDB(result.results.bindings);
    }
    
    return new Map<string, string>();
  } catch (error) {
    throw HTTPError(500, `Failed to get data point attributes for ${metric}`);
  }
}

// ========================================================================= //
// ========================== HELPER FUNCTIONS ============================= //
// ========================================================================= //

function removeIRI(line: string): string {
  return line.includes("#") ? line.split("#").slice(1).join("#") : line;
}

async function getDataSourceInfo(source: string) {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?p ?o WHERE {
          esg:${source} ?p ?o .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);
    
    if (result.results && result.results.bindings) {
      const resultMap = createDataMapFromGraphDB(result.results.bindings);
      return resultMap.get("label");
    }
    
    return undefined;
  } catch (error) {
    throw HTTPError(404, `Failed to retrieve source of node ${source}`);
  }
}

// auto choose the best data source for a given metric, following IFRS disclosure hierarchy
async function getBestDataSourceForMetric(metricID: string): Promise<{ dataSourceID: string; disclosureType: string } | null> {
    const query = `
        ${ESG}
        ${RDFS}
        SELECT ?dataSourceID ?disclosureType WHERE {
            ?observation a esg:Observation ;
                        esg:metric ?metric ;
                        esg:obtainedFrom ?dataSourceID ;
                        esg:disclosureType ?disclosureType .
            
            ?metric rdfs:label "${metricID}" .
        }
        ORDER BY 
            # IFRS: regulatory_filing > company_report > third_party
            (IF(?disclosureType = esg:regulatory_filing, 1, 
                IF(?disclosureType = esg:company_report, 2, 
                    IF(?disclosureType = esg:third_party, 3, 4))))
    `;

    try {
        const results = await executeSparqlQuery(query);
        console.log(`Querying data sources for metric ${metricID}, found ${results.results.bindings.length} results`);
        
        if (results.results.bindings.length > 0) {
            const binding = results.results.bindings[0];
            const dataSourceID = binding.dataSourceID?.value || '';
            const disclosureType = binding.disclosureType?.value?.split('#')[1] || 'unknown';
            
            console.log(`Selected data source for metric ${metricID}: ${dataSourceID} (disclosure type: ${disclosureType})`);
            
            return {
                dataSourceID,
                disclosureType
            };
        }
        
        console.log(`No data source found for metric ${metricID}`);
        return null;
    } catch (error) {
        console.error('Error querying best data source:', error);
        return null;
    }
}

export {
  getReportFramework,
  getCategoriesByIndustryAndReportFramework,
  getMetricsByIndustryAndCategory,
  getMetricAtributes, getDataPointAtribute,
  getDataSourceInfo,
  getBestDataSourceForMetric,
  executeSparqlQuery,
};
