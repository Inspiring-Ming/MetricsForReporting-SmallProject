/**
 * ESG IRI Generation Strategy
 * 
 * 职责：
 * - 提供语义网规范的IRI生成策略
 * - 确保知识图谱中资源标识的一致性
 * - 支持不同类型资源的IRI命名规范
 * - 管理命名空间和URI编码
 */

import { config } from '../../config/config';
import { Framework } from '../../domain/value-objects/MetricCode';

/**
 * IRI生成配置接口
 */
export interface IriConfig {
  baseUri: string;
  ontologyNamespace: string;
  metricsNamespace: string;
  batchNamespace: string;
  namedGraphNamespace: string;
}

/**
 * 默认IRI配置
 */
const DEFAULT_IRI_CONFIG: IriConfig = {
  baseUri: 'https://esg-kg.example.com',
  ontologyNamespace: 'http://example.org/esg#',
  metricsNamespace: 'https://esg-kg.example.com/metrics/',
  batchNamespace: 'https://esg-kg.example.com/batches/',
  namedGraphNamespace: 'https://esg-kg.example.com/graphs/'
};

/**
 * ESG知识图谱IRI生成策略
 * 
 * 根据语义网最佳实践生成标准化的IRI：
 * - 确保IRI的唯一性和持久性
 * - 遵循W3C语义网规范
 * - 支持多环境配置
 * - 提供统一的命名空间管理
 */
export class ESGIriStrategy {
  private static config: IriConfig;

  /**
   * 初始化IRI策略配置
   */
  static initialize(iriConfig?: Partial<IriConfig>): void {
    const envConfig = {
      baseUri: `http://${config.host}:${config.port}` || DEFAULT_IRI_CONFIG.baseUri,
      ontologyNamespace: DEFAULT_IRI_CONFIG.ontologyNamespace,
      metricsNamespace: DEFAULT_IRI_CONFIG.metricsNamespace,
      batchNamespace: DEFAULT_IRI_CONFIG.batchNamespace,
      namedGraphNamespace: DEFAULT_IRI_CONFIG.namedGraphNamespace
    };

    this.config = { ...envConfig, ...iriConfig };
  }

  /**
   * 获取当前配置
   */
  static getConfig(): IriConfig {
    if (!this.config) {
      this.initialize();
    }
    return this.config;
  }

  /**
   * 生成ESG指标的IRI
   * 
   * 格式：{metricsNamespace}{framework}/{industry}/{code}/{entityId}/{asOf}
   * 例如：https://esg-kg.example.com/metrics/SASB/commercial-banks/FN-CB-410a.1/entity123/2023-12-31
   * 
   * @param framework ESG框架 (SASB, GRI, TCFD, etc.)
   * @param industry 行业标识符
   * @param code 指标代码
   * @param entityId 实体标识符
   * @param asOf 报告日期 (YYYY-MM-DD格式)
   * @returns 标准化的指标IRI
   */
  static generateMetricIri(
    framework: Framework | string,
    industry: string,
    code: string,
    entityId: string,
    asOf: string
  ): string {
    const config = this.getConfig();
    
    // 规范化参数
    const normalizedFramework = this.encodeUriComponent(framework.toString());
    const normalizedIndustry = this.encodeUriComponent(industry.replace(/\s+/g, '-').toLowerCase());
    const normalizedCode = this.encodeUriComponent(code);
    const normalizedEntityId = this.encodeUriComponent(entityId);
    const normalizedAsOf = this.normalizeDate(asOf);
    
    return `${config.metricsNamespace}${normalizedFramework}/${normalizedIndustry}/${normalizedCode}/${normalizedEntityId}/${normalizedAsOf}`;
  }

  /**
   * 生成批次处理的IRI
   * 
   * 格式：{batchNamespace}{batchId}
   * 例如：https://esg-kg.example.com/batches/batch-20231201-001
   * 
   * @param batchId 批次标识符
   * @returns 标准化的批次IRI
   */
  static generateBatchIri(batchId: string): string {
    const config = this.getConfig();
    const normalizedBatchId = this.encodeUriComponent(batchId);
    
    return `${config.batchNamespace}${normalizedBatchId}`;
  }

  /**
   * 生成命名图的IRI
   * 
   * 格式：{namedGraphNamespace}{batchId}/{timestamp}
   * 例如：https://esg-kg.example.com/graphs/batch-20231201-001/20231201T120000Z
   * 
   * @param batchId 批次标识符
   * @param timestamp 时间戳
   * @returns 标准化的命名图IRI
   */
  static generateNamedGraph(batchId: string, timestamp: Date): string {
    const config = this.getConfig();
    const normalizedBatchId = this.encodeUriComponent(batchId);
    const timestampStr = timestamp.toISOString().replace(/[:.]/g, '').replace('T', 'T').replace('Z', 'Z');
    
    return `${config.namedGraphNamespace}${normalizedBatchId}/${timestampStr}`;
  }

  /**
   * 生成活动（Activity）的IRI
   * 
   * 格式：{baseUri}/activities/{activityType}/{activityId}
   * 例如：https://esg-kg.example.com/activities/data-ingestion/ing-20231201-001
   * 
   * @param activityType 活动类型
   * @param activityId 活动标识符
   * @returns 标准化的活动IRI
   */
  static generateActivityIri(activityType: string, activityId: string): string {
    const config = this.getConfig();
    const normalizedActivityType = this.encodeUriComponent(activityType.replace(/\s+/g, '-').toLowerCase());
    const normalizedActivityId = this.encodeUriComponent(activityId);
    
    return `${config.baseUri}/activities/${normalizedActivityType}/${normalizedActivityId}`;
  }

  /**
   * 生成代理（Agent）的IRI
   * 
   * 格式：{baseUri}/agents/{agentType}/{agentId}
   * 例如：https://esg-kg.example.com/agents/system/esg-platform
   * 
   * @param agentType 代理类型 (system, user, organization)
   * @param agentId 代理标识符
   * @returns 标准化的代理IRI
   */
  static generateAgentIri(agentType: 'system' | 'user' | 'organization', agentId: string): string {
    const config = this.getConfig();
    const normalizedAgentId = this.encodeUriComponent(agentId);
    
    return `${config.baseUri}/agents/${agentType}/${normalizedAgentId}`;
  }

  /**
   * 生成验证结果的IRI
   * 
   * 格式：{baseUri}/validations/{validationType}/{validationId}
   * 例如：https://esg-kg.example.com/validations/shacl/val-20231201-001
   * 
   * @param validationType 验证类型
   * @param validationId 验证标识符
   * @returns 标准化的验证IRI
   */
  static generateValidationIri(validationType: string, validationId: string): string {
    const config = this.getConfig();
    const normalizedValidationType = this.encodeUriComponent(validationType.toLowerCase());
    const normalizedValidationId = this.encodeUriComponent(validationId);
    
    return `${config.baseUri}/validations/${normalizedValidationType}/${normalizedValidationId}`;
  }

  /**
   * 构建命名空间前缀
   * 
   * @param prefix 前缀标识
   * @returns 命名空间URI
   */
  static buildNamespace(prefix: string): string {
    const config = this.getConfig();
    
    const namespaces: Record<string, string> = {
      'esg': config.ontologyNamespace,
      'metrics': config.metricsNamespace,
      'batches': config.batchNamespace,
      'graphs': config.namedGraphNamespace,
      'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
      'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'xsd': 'http://www.w3.org/2001/XMLSchema#',
      'qudt': 'http://qudt.org/schema/qudt/',
      'unit': 'http://qudt.org/vocab/unit/',
      'prov': 'http://www.w3.org/ns/prov#',
      'foaf': 'http://xmlns.com/foaf/0.1/',
      'dct': 'http://purl.org/dc/terms/'
    };

    return namespaces[prefix] || `${config.baseUri}/${prefix}#`;
  }

  /**
   * 验证IRI格式的有效性
   * 
   * @param iri 待验证的IRI
   * @returns 验证结果
   */
  static validateIri(iri: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基本格式检查
    if (!iri || typeof iri !== 'string') {
      errors.push('IRI must be a non-empty string');
      return { isValid: false, errors };
    }

    // URL格式检查
    try {
      new URL(iri);
    } catch {
      errors.push('IRI must be a valid URL');
    }

    // 协议检查
    if (!iri.startsWith('http://') && !iri.startsWith('https://')) {
      errors.push('IRI must use HTTP or HTTPS protocol');
    }

    // 长度检查
    if (iri.length > 2048) {
      errors.push('IRI length should not exceed 2048 characters');
    }

    // 字符检查（基本的URI字符集）
    const invalidChars = /[<>"{}|\\^`\s]/.exec(iri);
    if (invalidChars) {
      errors.push(`IRI contains invalid characters: ${invalidChars[0]}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 安全的URI组件编码
   * 
   * 确保URI组件符合RFC 3986规范，同时保持可读性
   * 
   * @param value 待编码的值
   * @returns 编码后的URI组件
   */
  static encodeUriComponent(value: string): string {
    if (!value) return '';
    
    // 移除或替换常见的问题字符
    const cleaned = value
      .trim()
      .replace(/\s+/g, '-')           // 空格替换为短横线
      .replace(/[\/\\]/g, '-')        // 斜杠替换为短横线
      .replace(/[<>"{}|^`]/g, '')     // 移除危险字符
      .replace(/[()]/g, '')           // 移除括号
      .replace(/[,;]/g, '-')          // 逗号分号替换为短横线
      .replace(/-+/g, '-')            // 多个短横线合并为一个
      .replace(/^-|-$/g, '');         // 移除首尾短横线

    // 对特殊字符进行URL编码
    return encodeURIComponent(cleaned)
      .replace(/%20/g, '-')           // 已编码的空格替换为短横线
      .replace(/%2D/g, '-');          // 已编码的短横线还原
  }

  /**
   * 规范化日期格式
   * 
   * @param dateInput 日期输入（Date对象、ISO字符串或YYYY-MM-DD格式）
   * @returns YYYY-MM-DD格式的日期字符串
   */
  static normalizeDate(dateInput: string | Date): string {
    let date: Date;

    if (typeof dateInput === 'string') {
      // 如果已是YYYY-MM-DD格式，直接返回
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date input: ${dateInput}`);
    }

    const isoString = date.toISOString().split('T')[0];
    if (!isoString) {
      throw new Error(`Failed to format date: ${dateInput}`);
    }
    
    return isoString;
  }

  /**
   * 提取IRI的本地名称部分
   * 
   * @param iri 完整的IRI
   * @returns IRI的本地名称部分
   */
  static extractLocalName(iri: string): string {
    const lastSlash = iri.lastIndexOf('/');
    const lastHash = iri.lastIndexOf('#');
    const splitPoint = Math.max(lastSlash, lastHash);
    
    return splitPoint >= 0 ? iri.substring(splitPoint + 1) : iri;
  }

  /**
   * 提取IRI的命名空间部分
   * 
   * @param iri 完整的IRI
   * @returns IRI的命名空间部分
   */
  static extractNamespace(iri: string): string {
    const lastSlash = iri.lastIndexOf('/');
    const lastHash = iri.lastIndexOf('#');
    const splitPoint = Math.max(lastSlash, lastHash);
    
    return splitPoint >= 0 ? iri.substring(0, splitPoint + 1) : iri;
  }

  /**
   * 检查IRI是否属于ESG知识图谱的命名空间
   * 
   * @param iri 待检查的IRI
   * @returns 是否属于ESG命名空间
   */
  static isEsgNamespace(iri: string): boolean {
    const config = this.getConfig();
    
    return iri.startsWith(config.baseUri) || 
           iri.startsWith(config.ontologyNamespace);
  }

  /**
   * 生成临时IRI（用于数据处理过程中的临时资源）
   * 
   * @param resourceType 资源类型
   * @param identifier 资源标识符
   * @returns 临时IRI
   */
  static generateTempIri(resourceType: string, identifier: string): string {
    const config = this.getConfig();
    const timestamp = Date.now();
    const normalizedType = this.encodeUriComponent(resourceType);
    const normalizedId = this.encodeUriComponent(identifier);
    
    return `${config.baseUri}/temp/${normalizedType}/${normalizedId}/${timestamp}`;
  }
}

// 导出配置
export { DEFAULT_IRI_CONFIG };
