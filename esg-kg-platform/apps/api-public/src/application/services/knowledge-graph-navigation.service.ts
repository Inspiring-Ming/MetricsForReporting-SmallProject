/**
 * Knowledge Graph Navigation Service - 知识图谱导航服务
 * 
 * 职责：
 * - 实现知识图谱导航用例
 * - 提供框架、分类、指标的层次化查询
 * - 应用缓存策略提升性能
 * - 处理业务逻辑和数据转换
 */

import {
  Framework,
  BaseResponse,
} from '@esg-platform/dto';

import {
  KnowledgeGraphNavigationPort,
  FrameworkInfo,
  CategoryInfo,
  MetricInfo
} from '../ports/inbound/knowledge-graph-navigation.port';

import {
  KnowledgeGraphPort,
  CachePort
} from '../ports/outbound';

import { DomainError, StatusCodes, ValidationError } from '../../domain/errors/domain-errors';

/**
 * 知识图谱导航错误
 */
export class KnowledgeGraphNavigationError extends DomainError {
  readonly code = 'KNOWLEDGE_GRAPH_NAVIGATION_ERROR';
  readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}

/**
 * 行业不存在错误
 */
export class IndustryNotFoundError extends DomainError {
  readonly code = 'INDUSTRY_NOT_FOUND';
  readonly statusCode = StatusCodes.NOT_FOUND;
}

/**
 * 知识图谱导航服务实现
 */
export class KnowledgeGraphNavigationService implements KnowledgeGraphNavigationPort {
  private readonly cacheConfig = {
    frameworksTtl: 24 * 60 * 60, // 24小时
    categoriesTtl: 12 * 60 * 60, // 12小时
    metricsTtl: 6 * 60 * 60,     // 6小时
  };

  constructor(
    private readonly knowledgeGraph: KnowledgeGraphPort,
    private readonly cache: CachePort
  ) {}

  /**
   * 获取指定行业适用的报告框架
   */
  async getFrameworksByIndustry(industry: string): Promise<BaseResponse<FrameworkInfo[]>> {
    try {
      // 参数验证
      if (!industry || typeof industry !== 'string' || industry.trim() === '') {
        throw new ValidationError(
          'Industry parameter is required and must be a non-empty string',
          { field: 'industry', code: 'INVALID_INDUSTRY_PARAMETER', message: 'Industry parameter is required and must be a non-empty string' }
        );
      }

      const normalizedIndustry = industry.trim();
      const cacheKey = `frameworks:${normalizedIndustry}`;

      // 尝试从缓存获取
      try {
        const cachedResult = await this.cache.get<FrameworkInfo[]>(cacheKey);
        if (cachedResult) {
          return {
            data: cachedResult,
            timestamp: new Date().toISOString(),
            status: 'success'
          };
        }
      } catch (cacheError) {
        // 缓存错误不应该影响业务逻辑，记录日志后继续
        console.warn('Cache get error for frameworks:', cacheError);
      }

      // 从知识图谱查询
      const frameworks = await this.knowledgeGraph.getReportingFrameworks(normalizedIndustry);
      
      // 业务逻辑：检查是否找到框架
      if (!frameworks || frameworks.length === 0) {
        throw new IndustryNotFoundError(
          `No reporting frameworks found for industry: ${normalizedIndustry}`,
          { field: 'industry', code: 'NO_FRAMEWORKS_FOUND', message: `No reporting frameworks found for industry: ${normalizedIndustry}` }
        );
      }

      // 数据转换
      const frameworkInfos: FrameworkInfo[] = frameworks.map(fw => ({
        code: fw.code,
        name: fw.name,
        description: fw.description
      }));

      // 写入缓存
      try {
        await this.cache.set(cacheKey, frameworkInfos, this.cacheConfig.frameworksTtl);
      } catch (cacheError) {
        console.warn('Cache set error for frameworks:', cacheError);
      }

      return {
        data: frameworkInfos,
        timestamp: new Date().toISOString(),
        status: 'success'
      };

    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new KnowledgeGraphNavigationError(
        `Failed to get frameworks for industry ${industry}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { code: 'FRAMEWORKS_QUERY_FAILED', message: `Failed to get frameworks for industry ${industry}` }
      );
    }
  }

  /**
   * 获取指定行业和框架下的分类
   */
  async getCategoriesByIndustryAndFramework(
    industry: string,
    framework: Framework
  ): Promise<BaseResponse<CategoryInfo[]>> {
    try {
      // 参数验证
      this.validateIndustryAndFramework(industry, framework);

      const normalizedIndustry = industry.trim();
      const cacheKey = `categories:${normalizedIndustry}:${framework}`;

      // 尝试从缓存获取
      try {
        const cachedResult = await this.cache.get<CategoryInfo[]>(cacheKey);
        if (cachedResult) {
          return {
            data: cachedResult,
            timestamp: new Date().toISOString(),
            status: 'success'
          };
        }
      } catch (cacheError) {
        console.warn('Cache get error for categories:', cacheError);
      }

      // 从知识图谱查询
      const categories = await this.knowledgeGraph.getCategoriesByIndustryAndFramework(
        normalizedIndustry,
        framework
      );

      // 业务逻辑：检查是否找到分类
      if (!categories || categories.length === 0) {
        throw new IndustryNotFoundError(
          `No categories found for industry: ${normalizedIndustry}, framework: ${framework}`,
          { code: 'NO_CATEGORIES_FOUND', message: `No categories found for industry: ${normalizedIndustry}, framework: ${framework}` }
        );
      }

      // 数据转换
      const categoryInfos: CategoryInfo[] = categories.map(cat => ({
        code: cat.code,
        name: cat.name,
        description: cat.description,
        framework,
        industry: normalizedIndustry
      }));

      // 写入缓存
      try {
        await this.cache.set(cacheKey, categoryInfos, this.cacheConfig.categoriesTtl);
      } catch (cacheError) {
        console.warn('Cache set error for categories:', cacheError);
      }

      return {
        data: categoryInfos,
        timestamp: new Date().toISOString(),
        status: 'success'
      };

    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new KnowledgeGraphNavigationError(
        `Failed to get categories for industry ${industry}, framework ${framework}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { code: 'CATEGORIES_QUERY_FAILED', message: `Failed to get categories for industry ${industry}, framework ${framework}` }
      );
    }
  }

  /**
   * 获取指定分类下的指标
   */
  async getMetricsByCategory(
    industry: string,
    framework: Framework,
    categoryLabel: string
  ): Promise<BaseResponse<MetricInfo[]>> {
    try {
      // 参数验证
      this.validateIndustryAndFramework(industry, framework);
      
      if (!categoryLabel || typeof categoryLabel !== 'string' || categoryLabel.trim() === '') {
        throw new ValidationError(
          'Category label parameter is required and must be a non-empty string',
          { field: 'categoryLabel', code: 'INVALID_CATEGORY_PARAMETER', message: 'Category label parameter is required and must be a non-empty string' }
        );
      }

      const normalizedIndustry = industry.trim();
      const normalizedCategoryLabel = categoryLabel.trim();
      const cacheKey = `metrics:${normalizedIndustry}:${framework}:${normalizedCategoryLabel}`;

      // 尝试从缓存获取
      try {
        const cachedResult = await this.cache.get<MetricInfo[]>(cacheKey);
        if (cachedResult) {
          return {
            data: cachedResult,
            timestamp: new Date().toISOString(),
            status: 'success'
          };
        }
      } catch (cacheError) {
        console.warn('Cache get error for metrics:', cacheError);
      }

      // 从知识图谱查询
      const metrics = await this.knowledgeGraph.getMetricsByIndustryAndCategory(
        normalizedIndustry,
        framework,
        normalizedCategoryLabel
      );

      // 业务逻辑：检查是否找到指标
      if (!metrics || metrics.length === 0) {
        throw new IndustryNotFoundError(
          `No metrics found for industry: ${normalizedIndustry}, framework: ${framework}, category: ${normalizedCategoryLabel}`,
          { code: 'NO_METRICS_FOUND', message: `No metrics found for industry: ${normalizedIndustry}, framework: ${framework}, category: ${normalizedCategoryLabel}` }
        );
      }

      // 数据转换
      const metricInfos: MetricInfo[] = metrics.map(metric => ({
        code: metric.code,
        name: metric.name,
        description: metric.description,
        category: normalizedCategoryLabel,
        framework,
        industry: normalizedIndustry,
        unitIri: metric.unitIri
      }));

      // 写入缓存
      try {
        await this.cache.set(cacheKey, metricInfos, this.cacheConfig.metricsTtl);
      } catch (cacheError) {
        console.warn('Cache set error for metrics:', cacheError);
      }

      return {
        data: metricInfos,
        timestamp: new Date().toISOString(),
        status: 'success'
      };

    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new KnowledgeGraphNavigationError(
        `Failed to get metrics for industry ${industry}, framework ${framework}, category ${categoryLabel}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { code: 'METRICS_QUERY_FAILED', message: `Failed to get metrics for industry ${industry}, framework ${framework}, category ${categoryLabel}` }
      );
    }
  }

  /**
   * 验证行业和框架参数
   */
  private validateIndustryAndFramework(industry: string, framework: Framework): void {
    if (!industry || typeof industry !== 'string' || industry.trim() === '') {
      throw new ValidationError(
        'Industry parameter is required and must be a non-empty string',
        { field: 'industry', code: 'INVALID_INDUSTRY_PARAMETER', message: 'Industry parameter is required and must be a non-empty string' }
      );
    }

    if (!framework) {
      throw new ValidationError(
        'Framework parameter is required',
        { field: 'framework', code: 'INVALID_FRAMEWORK_PARAMETER', message: 'Framework parameter is required' }
      );
    }

    // 验证框架是否为有效值
    const validFrameworks: Framework[] = ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'];
    if (!validFrameworks.includes(framework)) {
      throw new ValidationError(
        `Invalid framework: ${framework}. Valid values are: ${validFrameworks.join(', ')}`,
        { field: 'framework', code: 'INVALID_FRAMEWORK_VALUE', message: `Invalid framework: ${framework}. Valid values are: ${validFrameworks.join(', ')}` }
      );
    }
  }
}