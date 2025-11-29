import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/datasources';

describe('Datasource API - GET /api/kg/datasources/:id/variables', () => {
    beforeEach(async () => {
        await helper.cleanAllData();
    });

    afterAll(async () => {
        await helper.cleanAllData();
    });

    it('should return dataset variables sourced from the datasource', async () => {
        await helper.executeSparql(`
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      INSERT DATA {
        esg:TestDataSource a esg:DataSource ;
                           rdfs:label "Test Data Source" .
                           
        esg:Variable1 a esg:DatasetVariable ;
                      rdfs:label "VARIABLE_ONE" ;
                      esg:sourceFrom esg:TestDataSource .
                      
        esg:Variable2 a esg:DatasetVariable ;
                      rdfs:label "VARIABLE_TWO" ;
                      esg:sourceFrom esg:TestDataSource .
                      
        esg:OtherVariable a esg:DatasetVariable ;
                          rdfs:label "OTHER_VARIABLE" ;
                          esg:sourceFrom esg:OtherDataSource .
      }
    `);

        const response = await request(app)
            .get(`${baseUrl}/TestDataSource/variables`)
            .expect(200);

        expect(response.body).toHaveProperty('datasource_id');
        expect(response.body).toHaveProperty('variables');
        expect(Array.isArray(response.body.variables)).toBe(true);
        expect(response.body.variables).toHaveLength(2);

        const variableLabels = response.body.variables.map((v: any) => v.label);
        expect(variableLabels).toContain('VARIABLE_ONE');
        expect(variableLabels).toContain('VARIABLE_TWO');
        expect(variableLabels).not.toContain('OTHER_VARIABLE');
    });

    it('should return empty list if no variables use the datasource', async () => {
        await helper.executeSparql(`
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      INSERT DATA {
        esg:EmptyDataSource a esg:DataSource ;
                            rdfs:label "Empty Data Source" .
      }
    `);

        const response = await request(app)
            .get(`${baseUrl}/EmptyDataSource/variables`)
            .expect(200);

        expect(response.body.variables).toHaveLength(0);
    });

    it('should return 404 if datasource does not exist', async () => {
        await request(app)
            .get(`${baseUrl}/NonExistentDataSource/variables`)
            .expect(404);
    });
});
