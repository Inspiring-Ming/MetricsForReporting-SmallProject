import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/datasources';

describe('Datasource API - GET /api/kg/datasources/:id/metrics', () => {
    beforeEach(async () => {
        await helper.cleanAllData();
    });

    afterAll(async () => {
        await helper.cleanAllData();
    });

    it('should return metrics indirectly associated with the datasource', async () => {
        await helper.executeSparql(`
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      INSERT DATA {
        esg:TestDataSource a esg:DataSource ;
                           rdfs:label "Test Data Source" .
                           
        esg:Variable1 a esg:DatasetVariable ;
                      rdfs:label "VARIABLE_ONE" ;
                      esg:sourceFrom esg:TestDataSource .
                      
        esg:Metric1 a esg:Metric ;
                    rdfs:label "Metric One" ;
                    esg:hasCalculationMethod "direct_measurement" ;
                    esg:obtainedFrom esg:Variable1 .
                    
        esg:Variable2 a esg:DatasetVariable ;
                      rdfs:label "VARIABLE_TWO" ;
                      esg:sourceFrom esg:TestDataSource .
                      
        esg:Metric2 a esg:Metric ;
                    rdfs:label "Metric Two" ;
                    esg:hasCalculationMethod "calculation_model" ;
                    esg:obtainedFrom esg:Variable2 .
                    
        esg:OtherDataSource a esg:DataSource ;
                            rdfs:label "Other Data Source" .
                            
        esg:OtherVariable a esg:DatasetVariable ;
                          rdfs:label "OTHER_VARIABLE" ;
                          esg:sourceFrom esg:OtherDataSource .
                          
        esg:OtherMetric a esg:Metric ;
                        rdfs:label "Other Metric" ;
                        esg:obtainedFrom esg:OtherVariable .
      }
    `);

        const response = await request(app)
            .get(`${baseUrl}/TestDataSource/metrics`)
            .expect(200);

        expect(response.body).toHaveProperty('datasource_id');
        expect(response.body).toHaveProperty('metrics');
        expect(Array.isArray(response.body.metrics)).toBe(true);
        expect(response.body.metrics).toHaveLength(2);

        const metricLabels = response.body.metrics.map((m: any) => m.label);
        expect(metricLabels).toContain('Metric One');
        expect(metricLabels).toContain('Metric Two');
        expect(metricLabels).not.toContain('Other Metric');
    });

    it('should return empty list if no metrics are associated with the datasource', async () => {
        await helper.executeSparql(`
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      INSERT DATA {
        esg:EmptyDataSource a esg:DataSource ;
                            rdfs:label "Empty Data Source" .
                            
        esg:Variable1 a esg:DatasetVariable ;
                      rdfs:label "VARIABLE_ONE" ;
                      esg:sourceFrom esg:EmptyDataSource .
      }
    `);

        const response = await request(app)
            .get(`${baseUrl}/EmptyDataSource/metrics`)
            .expect(200);

        expect(response.body.metrics).toHaveLength(0);
    });

    it('should return 404 if datasource does not exist', async () => {
        await request(app)
            .get(`${baseUrl}/NonExistentDataSource/metrics`)
            .expect(404);
    });
});
