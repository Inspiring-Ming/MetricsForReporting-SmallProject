/**
 * DTO Mappers for Computation operations
 */

import {
  ComputationRequest,
  ComputationResult,
  ComputationMethod,
  BaseResponse,
  Framework
} from '@esg-platform/dto';

import {
  HttpComputationRequest,
  HttpComputationResponse,
  HttpDiscoverMethodsRequest,
  HttpDiscoverMethodsResponse,
  HttpComputationMethod
} from '../dtos/http-computation.dto';

export class ComputationDtoMapper {
  /**
   * Map HTTP computation request to Application computation request
   */
  static toComputationRequest(httpRequest: HttpComputationRequest): ComputationRequest {
    return {
      framework: httpRequest.framework,
      industry: httpRequest.industry,
      code: 'COMPUTE', // Default code for generic computation
      entityId: httpRequest.entityId,
      inputValues: httpRequest.inputs,
      asOf: httpRequest.asOf,
      source: 'api-public'
    };
  }

  /**
   * Map HTTP discover methods request to framework/industry parameters
   */
  static toMethodsQuery(httpRequest: HttpDiscoverMethodsRequest): {
    framework: Framework;
    industry: string;
    metricCode: string;
  } {
    return {
      framework: httpRequest.framework,
      industry: httpRequest.industry,
      metricCode: httpRequest.metricCode
    };
  }

  /**
   * Map query parameters to discover methods query
   */
  static toDiscoverMethodsQuery(queryParams: any): {
    framework: Framework;
    industry: string;
  } {
    return {
      framework: queryParams.framework as Framework,
      industry: queryParams.industry as string
    };
  }

  /**
   * Map Application computation result to HTTP response
   */
  static toHttpComputationResponse(
    appResponse: BaseResponse<ComputationResult>
  ): HttpComputationResponse {
    const data = appResponse.data;
    return {
      result: data.value,
      formula: data.method.formula || 'N/A',
      inputs: data.inputValues,
      metadata: {
        framework: 'SASB', // Would come from request context
        industry: 'Banking', // Would come from request context
        entityId: 'entity-id', // Would come from request context
        asOf: 'as-of-date', // Would come from request context
        computedAt: data.computedAt
      }
    };
  }

  /**
   * Map Application computation method to HTTP computation method
   */
  static toHttpComputationMethod(method: ComputationMethod): HttpComputationMethod {
    return {
      methodId: method.code,
      formula: method.formula || 'N/A',
      requiredInputs: method.inputMetrics.map(input => input.code || input.name),
      description: method.description,
      priority: 1 // Default priority
    };
  }

  /**
   * Map Application methods array to HTTP discover methods response
   */
  static toHttpDiscoverMethodsResponse(
    methods: ComputationMethod[],
    metricCode: string,
    framework: Framework,
    industry: string
  ): HttpDiscoverMethodsResponse;
  
  /**
   * Map Application response to HTTP discover methods response
   */
  static toHttpDiscoverMethodsResponse(
    appResponse: BaseResponse<ComputationMethod[]>
  ): HttpDiscoverMethodsResponse;

  static toHttpDiscoverMethodsResponse(
    methodsOrResponse: ComputationMethod[] | BaseResponse<ComputationMethod[]>,
    metricCode?: string,
    framework?: Framework,
    industry?: string
  ): HttpDiscoverMethodsResponse {
    if (Array.isArray(methodsOrResponse)) {
      // Legacy overload
      return {
        methods: methodsOrResponse.map(method => this.toHttpComputationMethod(method)),
        metricCode: metricCode!,
        framework: framework!,
        industry: industry!
      };
    } else {
      // New overload - extract from response
      const response = methodsOrResponse as BaseResponse<ComputationMethod[]>;
      return {
        methods: response.data.map(method => this.toHttpComputationMethod(method)),
        metricCode: 'GENERIC',
        framework: 'SASB' as Framework, // Default - should come from request context
        industry: 'Generic' // Default - should come from request context
      };
    }
  }
}