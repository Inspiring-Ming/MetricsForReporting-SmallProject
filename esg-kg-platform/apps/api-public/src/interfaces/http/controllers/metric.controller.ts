/**
 * Metric Controller - Thin HTTP interface layer
 * 
 * Responsibilities:
 * - Request parsing and validation
 * - DTO mapping
 * - Application service invocation
 * - Response serialization
 * - HTTP status code mapping
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { MetricManagementPort } from '../../../application/ports/inbound';
import { MetricDtoMapper } from '../mappers/metric.mapper';
import {
  HttpCreateMetricRequest,
  HttpBatchMetricRequest,
  HttpUpdateMetricRequest,
  HttpMetricQueryParams,
  HttpErrorResponse
} from '../dtos';

export class MetricController {
  constructor(
    private readonly metricService: MetricManagementPort
  ) {}

  /**
   * POST /metrics - Create single metric
   * Note: Request validation handled by middleware
   */
  async createMetric(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Map HTTP DTO to Application DTO
      const httpRequest = req.body as HttpCreateMetricRequest;
      const appRequest = MetricDtoMapper.toCreateMetricRequest(httpRequest);

      // Invoke application service (includes business validation)
      const appResponse = await this.metricService.createMetric(appRequest);

      // Map and return response
      const httpResponse = MetricDtoMapper.toHttpSuccessResponse(
        appResponse,
        MetricDtoMapper.toHttpMetricResponse
      );

      res.status(201).json(httpResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /metrics/batch - Create multiple metrics
   * Note: Request validation handled by middleware
   */
  async createMetricsBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const httpRequest = req.body as HttpBatchMetricRequest;
      const appRequest = MetricDtoMapper.toBatchMetricRequest(httpRequest);

      const appResponse = await this.metricService.createMetricsBatch(appRequest);

      const httpResponse = MetricDtoMapper.toHttpSuccessResponse(
        appResponse,
        MetricDtoMapper.toHttpBatchMetricResponse
      );

      res.status(201).json(httpResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /metrics - Query metrics with filters and pagination
   */
  async queryMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const httpParams = req.query as unknown as HttpMetricQueryParams;
      const appParams = MetricDtoMapper.toMetricQueryParams(httpParams);

      const appResponse = await this.metricService.queryMetrics(appParams);

      const httpResponse = MetricDtoMapper.toHttpPaginatedResponse(appResponse);

      res.status(200).json(httpResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /metrics/:id - Get specific metric by ID
   */
  async getMetricById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        const errorResponse: HttpErrorResponse = {
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

      const httpResponse = MetricDtoMapper.toHttpSuccessResponse(
        appResponse,
        MetricDtoMapper.toHttpMetricResponse
      );

      res.status(200).json(httpResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /metrics/:id - Update existing metric
   */
  async updateMetric(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const errors = validationResult(req);

      if (!id || typeof id !== 'string') {
        const errorResponse: HttpErrorResponse = {
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
        const errorResponse: HttpErrorResponse = {
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

      const httpRequest = req.body as HttpUpdateMetricRequest;
      const appRequest = MetricDtoMapper.toUpdateMetricRequest(httpRequest);

      const appResponse = await this.metricService.updateMetric(id, appRequest);

      const httpResponse = MetricDtoMapper.toHttpSuccessResponse(
        appResponse,
        MetricDtoMapper.toHttpMetricResponse
      );

      res.status(200).json(httpResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /metrics/:id - Delete metric by ID
   */
  async deleteMetric(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        const errorResponse: HttpErrorResponse = {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /metrics/validate - Validate metric data without persisting
   */
  async validateMetric(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorResponse: HttpErrorResponse = {
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

      const httpRequest = req.body as HttpCreateMetricRequest;
      const metricDto = MetricDtoMapper.toCreateMetricRequest(httpRequest);

      const appResponse = await this.metricService.validateMetric(metricDto);

      const httpResponse = MetricDtoMapper.toHttpValidationResponse(appResponse);

      res.status(200).json(httpResponse);
    } catch (error) {
      next(error);
    }
  }
}