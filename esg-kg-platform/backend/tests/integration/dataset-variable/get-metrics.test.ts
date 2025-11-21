import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('DatasetVariable API - GET /api/kg/dataset-variables/:id/metrics', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  it('should return metrics that use the dataset variable', async () => {
    await helper.executeSparql(`
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      INSERT DATA {
        esg:TestVariable a esg:DatasetVariable ;
                         rdfs:label "TEST_VARIABLE" .
                         
        esg:Metric1 a esg:Metric ;
                    rdfs:label "Metric One" ;
                    esg:hasCalculationMethod "direct_measurement" ;
                    esg:obtainedFrom esg:TestVariable .
                    
        esg:Metric2 a esg:Metric ;
                    rdfs:label "Metric Two" ;
                    esg:hasCalculationMethod "calculation_model" ;
                    esg:obtainedFrom esg:TestVariable .
                    
        esg:OtherMetric a esg:Metric ;
                        rdfs:label "Other Metric" ;
                        esg:obtainedFrom esg:OtherVariable .
      }
    `);

    const response = await request(app)
      .get(`${baseUrl}/TestVariable/metrics`)
      .expect(200);

    expect(response.body).toHaveProperty('variable_id');
    expect(response.body).toHaveProperty('metrics');
    expect(Array.isArray(response.body.metrics)).toBe(true);
    expect(response.body.metrics).toHaveLength(2);
    
    const metricLabels = response.body.metrics.map((m: any) => m.label);
    expect(metricLabels).toContain('Metric One');
    expect(metricLabels).toContain('Metric Two');
    expect(metricLabels).not.toContain('Other Metric');
  });

  it('should return empty list if no metrics use the variable', async () => {
    await helper.executeSparql(`
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      INSERT DATA {
        esg:LonelyVariable a esg:DatasetVariable ;
                           rdfs:label "LONELY_VARIABLE" .
      }
    `);

    const response = await request(app)
      .get(`${baseUrl}/LonelyVariable/metrics`)
      .expect(200);

    expect(response.body.metrics).toHaveLength(0);
  });

  it('should return 404 if dataset variable does not exist', async () => {
    await request(app)
      .get(`${baseUrl}/NonExistentVariable/metrics`)
      .expect(404);
  });
});
