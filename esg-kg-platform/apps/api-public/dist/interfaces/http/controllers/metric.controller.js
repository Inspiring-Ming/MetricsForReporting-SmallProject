import { validationResult } from 'express-validator';
import { MetricDtoMapper } from '../mappers/metric.mapper';
export class MetricController {
    metricService;
    constructor(metricService) {
        this.metricService = metricService;
    }
    async createMetric(req, res, next) {
        try {
            const httpRequest = req.body;
            const appRequest = MetricDtoMapper.toCreateMetricRequest(httpRequest);
            const appResponse = await this.metricService.createMetric(appRequest);
            const httpResponse = MetricDtoMapper.toHttpSuccessResponse(appResponse, MetricDtoMapper.toHttpMetricResponse);
            res.status(201).json(httpResponse);
        }
        catch (error) {
            next(error);
        }
    }
    async createMetricsBatch(req, res, next) {
        try {
            const httpRequest = req.body;
            const appRequest = MetricDtoMapper.toBatchMetricRequest(httpRequest);
            const appResponse = await this.metricService.createMetricsBatch(appRequest);
            const httpResponse = MetricDtoMapper.toHttpSuccessResponse(appResponse, MetricDtoMapper.toHttpBatchMetricResponse);
            res.status(201).json(httpResponse);
        }
        catch (error) {
            next(error);
        }
    }
    async queryMetrics(req, res, next) {
        try {
            const httpParams = req.query;
            const appParams = MetricDtoMapper.toMetricQueryParams(httpParams);
            const appResponse = await this.metricService.queryMetrics(appParams);
            const httpResponse = MetricDtoMapper.toHttpPaginatedResponse(appResponse);
            res.status(200).json(httpResponse);
        }
        catch (error) {
            next(error);
        }
    }
    async getMetricById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== 'string') {
                const errorResponse = {
                    type: 'invalid_parameter',
                    title: 'Invalid metric ID',
                    status: 400,
                    detail: 'The metric ID parameter is required and must be a valid string.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const appResponse = await this.metricService.getMetricById(id);
            const httpResponse = MetricDtoMapper.toHttpSuccessResponse(appResponse, MetricDtoMapper.toHttpMetricResponse);
            res.status(200).json(httpResponse);
        }
        catch (error) {
            next(error);
        }
    }
    async updateMetric(req, res, next) {
        try {
            const { id } = req.params;
            const errors = validationResult(req);
            if (!id || typeof id !== 'string') {
                const errorResponse = {
                    type: 'invalid_parameter',
                    title: 'Invalid metric ID',
                    status: 400,
                    detail: 'The metric ID parameter is required and must be a valid string.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            if (!errors.isEmpty()) {
                const errorResponse = {
                    type: 'validation_error',
                    title: 'Invalid update data',
                    status: 400,
                    detail: 'The update request contains invalid data.',
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
            const appRequest = MetricDtoMapper.toUpdateMetricRequest(httpRequest);
            const appResponse = await this.metricService.updateMetric(id, appRequest);
            const httpResponse = MetricDtoMapper.toHttpSuccessResponse(appResponse, MetricDtoMapper.toHttpMetricResponse);
            res.status(200).json(httpResponse);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteMetric(req, res, next) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== 'string') {
                const errorResponse = {
                    type: 'invalid_parameter',
                    title: 'Invalid metric ID',
                    status: 400,
                    detail: 'The metric ID parameter is required and must be a valid string.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const appResponse = await this.metricService.deleteMetric(id);
            const httpResponse = MetricDtoMapper.toHttpSuccessResponse(appResponse);
            res.status(204).json(httpResponse);
        }
        catch (error) {
            next(error);
        }
    }
    async validateMetric(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorResponse = {
                    type: 'validation_error',
                    title: 'Invalid validation request',
                    status: 400,
                    detail: 'The validation request contains invalid data.',
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
            const metricDto = MetricDtoMapper.toCreateMetricRequest(httpRequest);
            const appResponse = await this.metricService.validateMetric(metricDto);
            const httpResponse = MetricDtoMapper.toHttpValidationResponse(appResponse);
            res.status(200).json(httpResponse);
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=metric.controller.js.map