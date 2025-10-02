import { GraphDBRepository } from '../repositories/graphDBRepository';
import { Repository } from '../types';

/**
 * 健康检查服务类 - 处理系统健康状态相关业务逻辑
 */
export class HealthService {
  private graphDBRepository: GraphDBRepository;

  constructor(graphDBRepository: GraphDBRepository) {
    this.graphDBRepository = graphDBRepository;
  }

  /**
   * 系统健康检查
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
      graphdb: {
        status: 'up' | 'down';
        responseTime?: number;
        error?: string;
      };
    };
    version: string;
    uptime: number;
  }> {
    const startTime = Date.now();
    let graphdbStatus: 'up' | 'down' = 'down';
    let graphdbError: string | undefined;
    let graphdbResponseTime: number | undefined;

    try {
      const graphdbStart = Date.now();
      await this.graphDBRepository.healthCheck();
      graphdbResponseTime = Date.now() - graphdbStart;
      graphdbStatus = 'up';
    } catch (error) {
      graphdbError = error instanceof Error ? error.message : 'Unknown error';
    }

    const overallStatus = graphdbStatus === 'up' ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        graphdb: {
          status: graphdbStatus,
          responseTime: graphdbResponseTime,
          error: graphdbError
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };
  }

  /**
   * 获取仓库列表
   */
  async getRepositories(): Promise<Repository[]> {
    try {
      const response = await this.graphDBRepository.listRepositories();
      return this.parseRepositories(response);
    } catch (error) {
      throw error; // 让上层处理错误
    }
  }

  /**
   * 解析仓库响应数据
   */
  private parseRepositories(response: any): Repository[] {
    if (!response || !response.results || !response.results.bindings) {
      return [];
    }

    return response.results.bindings.map((binding: any) => ({
      id: binding.id?.value || '',
      title: binding.title?.value || binding.id?.value || '',
      uri: binding.uri?.value || '',
      type: binding.type?.value || '',
      sesameType: binding.sesameType?.value || '',
      location: binding.location?.value || '',
      readable: binding.readable?.value === 'true',
      writable: binding.writable?.value === 'true'
    }));
  }

  /**
   * 系统信息
   */
  getSystemInfo(): {
    nodeVersion: string;
    platform: string;
    architecture: string;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    environment: string;
  } {
    const memUsage = process.memoryUsage();
    
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      environment: process.env.NODE_ENV || 'development'
    };
  }
}