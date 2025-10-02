/**
 * 自定义错误类型定义
 */

export enum ErrorCode {
  // 通用错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  
  // GraphDB 相关错误
  GRAPHDB_CONNECTION_ERROR = 'GRAPHDB_CONNECTION_ERROR',
  GRAPHDB_QUERY_ERROR = 'GRAPHDB_QUERY_ERROR',
  GRAPHDB_WRITE_ERROR = 'GRAPHDB_WRITE_ERROR',
  
  // SPARQL 相关错误
  SPARQL_SYNTAX_ERROR = 'SPARQL_SYNTAX_ERROR',
  SPARQL_EXECUTION_ERROR = 'SPARQL_EXECUTION_ERROR',
  
  // SHACL 相关错误
  SHACL_VALIDATION_ERROR = 'SHACL_VALIDATION_ERROR',
  
  // Wizard 相关错误
  WIZARD_PAYLOAD_ERROR = 'WIZARD_PAYLOAD_ERROR',
  WIZARD_TRIPLE_BUILD_ERROR = 'WIZARD_TRIPLE_BUILD_ERROR',
  
  // TTL 相关错误
  TTL_PARSE_ERROR = 'TTL_PARSE_ERROR',
  TTL_UPLOAD_ERROR = 'TTL_UPLOAD_ERROR'
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // 设置错误名称为类名
    this.name = this.constructor.name;
    
    // 维护 stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(ErrorCode.NOT_FOUND, message, 404, true, details);
  }
}

export class GraphDBError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.GRAPHDB_CONNECTION_ERROR, message, 503, true, details);
  }
}

export class GraphDBQueryError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.GRAPHDB_QUERY_ERROR, message, 400, true, details);
  }
}

export class GraphDBWriteError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.GRAPHDB_WRITE_ERROR, message, 500, true, details);
  }
}

export class SparqlError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.SPARQL_SYNTAX_ERROR, message, 400, true, details);
  }
}

export class ShaclValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.SHACL_VALIDATION_ERROR, message, 422, true, details);
  }
}

export class WizardError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.WIZARD_PAYLOAD_ERROR, message, 400, true, details);
  }
}

export class TTLError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.TTL_PARSE_ERROR, message, 400, true, details);
  }
}