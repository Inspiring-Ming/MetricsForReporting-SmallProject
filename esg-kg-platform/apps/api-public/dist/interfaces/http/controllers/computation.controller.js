import { validationResult } from 'express-validator';
import { ComputationDtoMapper } from '../mappers/computation.mapper';
export class ComputationController {
    computationService;
    constructor(computationService) {
        this.computationService = computationService;
    }
    async executeComputation(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorResponse = {
                    type: 'validation_error',
                    title: 'Invalid computation request',
                    status: 400,
                    detail: 'The computation request contains invalid data.',
                    instance: req.path,
                    errors: errors.array().map(err => ({
                        field: 'path' in err ? err.path : 'unknown',
                        code: 'invalid_format',
                        message: err.msg
                    })),
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const httpRequest = req.body;
            const appRequest = ComputationDtoMapper.toComputationRequest(httpRequest);
            const appResponse = await this.computationService.executeComputation(appRequest);
            const httpResponse = ComputationDtoMapper.toHttpComputationResponse(appResponse);
            res.status(200).json({
                data: httpResponse,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getComputationMethods(req, res, next) {
        try {
            const { framework, industry } = req.query;
            if (!framework || !industry) {
                const errorResponse = {
                    type: 'missing_parameters',
                    title: 'Missing required parameters',
                    status: 400,
                    detail: 'Framework and industry parameters are required.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const appQuery = ComputationDtoMapper.toDiscoverMethodsQuery(req.query);
            const appResponse = await this.computationService.getComputationMethods(appQuery.framework, appQuery.industry);
            const httpResponse = ComputationDtoMapper.toHttpDiscoverMethodsResponse(appResponse);
            res.status(200).json({
                data: httpResponse,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getComputationMethod(req, res, next) {
        try {
            const { code } = req.params;
            const { framework, industry } = req.query;
            if (!code || !framework || !industry) {
                const errorResponse = {
                    type: 'missing_parameters',
                    title: 'Missing required parameters',
                    status: 400,
                    detail: 'Method code, framework, and industry are required.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const queryParams = ComputationDtoMapper.toDiscoverMethodsQuery({ framework, industry });
            const appResponse = await this.computationService.getComputationMethod(queryParams.framework, queryParams.industry, code);
            const httpResponse = ComputationDtoMapper.toHttpComputationMethod(appResponse.data);
            res.status(200).json({
                data: httpResponse,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async validateComputationInputs(req, res, next) {
        try {
            const { framework, industry, code, inputValues } = req.body;
            if (!framework || !industry || !code || !inputValues) {
                const errorResponse = {
                    type: 'missing_parameters',
                    title: 'Missing validation parameters',
                    status: 400,
                    detail: 'Framework, industry, code, and inputValues are required for validation.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const queryParams = ComputationDtoMapper.toDiscoverMethodsQuery({ framework, industry });
            const appResponse = await this.computationService.validateComputationInputs(queryParams.framework, queryParams.industry, code, inputValues);
            res.status(200).json({
                data: {
                    valid: appResponse.data.valid,
                    errors: appResponse.data.errors
                },
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async discoverMethods(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorResponse = {
                    type: 'validation_error',
                    title: 'Invalid discovery request',
                    status: 400,
                    detail: 'The method discovery request contains invalid data.',
                    instance: req.path,
                    errors: errors.array().map(err => ({
                        field: 'path' in err ? err.path : 'unknown',
                        code: 'invalid_format',
                        message: err.msg
                    })),
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const httpRequest = req.body;
            const queryParams = ComputationDtoMapper.toMethodsQuery(httpRequest);
            const appResponse = await this.computationService.getComputationMethods(queryParams.framework, queryParams.industry);
            const filteredMethods = httpRequest.metricCode && httpRequest.metricCode !== 'GENERIC'
                ? appResponse.data.filter(method => method.code.includes(httpRequest.metricCode) ||
                    method.name.includes(httpRequest.metricCode))
                : appResponse.data;
            const httpResponse = ComputationDtoMapper.toHttpDiscoverMethodsResponse(filteredMethods, queryParams.metricCode, queryParams.framework, queryParams.industry);
            res.status(200).json({
                data: httpResponse,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=computation.controller.js.map