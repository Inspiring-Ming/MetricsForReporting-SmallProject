import { GraphDBRepository } from '../repositories/graphDBRepository';
import { TTLUploadRequest } from '../types';
import { ValidationError, TTLError } from '../types/errors';
import { config } from '../config';

/**
 * TTL 服务类 - 处理 TTL 文件上传相关业务逻辑
 */
export class TTLService {
  private graphDBRepository: GraphDBRepository;

  constructor(graphDBRepository: GraphDBRepository) {
    this.graphDBRepository = graphDBRepository;
  }

  /**
   * 上传 TTL 文件
   */
  async uploadTTLFile(request: TTLUploadRequest): Promise<{ ok: boolean; message: string; graph: string | null; repository: string }> {
    this.validateTTLRequest(request);

    try {
      const targetGraph = request.graph || config.DEFAULT_GRAPH;
      
      await this.graphDBRepository.uploadTTLFile(
        request.ttl,
        targetGraph,
        request.baseUri
      );

      return {
        ok: true,
        message: 'TTL file uploaded successfully',
        graph: targetGraph || null,
        repository: config.GRAPHDB_REPO
      };
    } catch (error) {
      throw new TTLError(
        `TTL upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { request, originalError: error }
      );
    }
  }

  /**
   * 验证 TTL 请求
   */
  private validateTTLRequest(request: TTLUploadRequest): void {
    if (!request) {
      throw new ValidationError('TTL upload request is required');
    }

    if (!request.ttl || typeof request.ttl !== 'string') {
      throw new ValidationError('TTL content is required and must be a string');
    }

    if (request.ttl.trim().length === 0) {
      throw new ValidationError('TTL content cannot be empty');
    }

    // 基本的 TTL 语法检查
    const hasPrefixes = /@prefix/.test(request.ttl);
    const hasTriples = /\s+\.\s*$/m.test(request.ttl);
    
    if (!hasPrefixes && !hasTriples) {
      console.warn('TTL content may not be valid: no prefixes or triples detected');
    }

    // 验证 graph URI 格式
    if (request.graph && !this.isValidURI(request.graph)) {
      throw new ValidationError('Graph must be a valid URI');
    }

    // 验证 baseUri 格式
    if (request.baseUri && !this.isValidURI(request.baseUri)) {
      throw new ValidationError('Base URI must be a valid URI');
    }
  }

  /**
   * 验证 URI 格式
   */
  private isValidURI(uri: string): boolean {
    try {
      new URL(uri);
      return true;
    } catch {
      // 检查是否为相对 URI 或其他有效格式
      return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(uri);
    }
  }

  /**
   * 估算 TTL 文件大小（字节）
   */
  estimateTTLSize(ttl: string): number {
    return new TextEncoder().encode(ttl).length;
  }

  /**
   * 检查 TTL 大小是否超过限制
   */
  checkSizeLimit(ttl: string, maxSizeMB: number = 2): void {
    const sizeBytes = this.estimateTTLSize(ttl);
    const sizeMB = sizeBytes / (1024 * 1024);
    
    if (sizeMB > maxSizeMB) {
      throw new ValidationError(
        `TTL file is too large: ${sizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)`,
        { actualSize: sizeMB, maxSize: maxSizeMB }
      );
    }
  }
}