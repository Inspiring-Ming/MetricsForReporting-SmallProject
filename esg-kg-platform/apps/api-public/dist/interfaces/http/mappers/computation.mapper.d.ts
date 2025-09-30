import { ComputationRequest, ComputationResult, ComputationMethod, BaseResponse, Framework } from '@esg-platform/dto';
import { HttpComputationRequest, HttpComputationResponse, HttpDiscoverMethodsRequest, HttpDiscoverMethodsResponse, HttpComputationMethod } from '../dtos/http-computation.dto';
export declare class ComputationDtoMapper {
    static toComputationRequest(httpRequest: HttpComputationRequest): ComputationRequest;
    static toMethodsQuery(httpRequest: HttpDiscoverMethodsRequest): {
        framework: Framework;
        industry: string;
        metricCode: string;
    };
    static toDiscoverMethodsQuery(queryParams: any): {
        framework: Framework;
        industry: string;
    };
    static toHttpComputationResponse(appResponse: BaseResponse<ComputationResult>): HttpComputationResponse;
    static toHttpComputationMethod(method: ComputationMethod): HttpComputationMethod;
    static toHttpDiscoverMethodsResponse(methods: ComputationMethod[], metricCode: string, framework: Framework, industry: string): HttpDiscoverMethodsResponse;
    static toHttpDiscoverMethodsResponse(appResponse: BaseResponse<ComputationMethod[]>): HttpDiscoverMethodsResponse;
}
//# sourceMappingURL=computation.mapper.d.ts.map