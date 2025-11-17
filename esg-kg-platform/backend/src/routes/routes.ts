/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IndustryController } from './../controllers/kg_controllers/industryController';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "Pick_Industry.iri-or-label-or-description_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"description":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustryDTO": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Industry.iri-or-label-or-description_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustriesResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"IndustryDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_ReportingFramework.iri-or-label_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustryDetailDTO": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string"},
            "description": {"dataType":"string"},
            "reportsUsing": {"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_ReportingFramework.iri-or-label_"}},
            "createdAt": {"dataType":"string"},
            "updatedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustryDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"ref":"IndustryDetailDTO","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateIndustryResponse": {
        "dataType": "refObject",
        "properties": {
            "uri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateIndustryRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "reportsUsing": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateIndustryResponse": {
        "dataType": "refObject",
        "properties": {
            "uri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateIndustryRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "description": {"dataType":"string"},
            "reportsUsing": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteIndustryResponse": {
        "dataType": "refObject",
        "properties": {
            "uri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsIndustryController_getIndustriesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/industries',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.getIndustriesWithTsoa)),

            async function IndustryController_getIndustriesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_getIndustriesWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'getIndustriesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_getIndustryByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/industries/:id',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.getIndustryByIdWithTsoa)),

            async function IndustryController_getIndustryByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_getIndustryByIdWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'getIndustryByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_createIndustryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateIndustryRequest"},
        };
        app.post('/api/kg/industries',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.createIndustryWithTsoa)),

            async function IndustryController_createIndustryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_createIndustryWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'createIndustryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_updateIndustryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateIndustryRequest"},
        };
        app.patch('/api/kg/industries/:id',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.updateIndustryWithTsoa)),

            async function IndustryController_updateIndustryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_updateIndustryWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'updateIndustryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_deleteIndustryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/industries/:id',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.deleteIndustryWithTsoa)),

            async function IndustryController_deleteIndustryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_deleteIndustryWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'deleteIndustryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
