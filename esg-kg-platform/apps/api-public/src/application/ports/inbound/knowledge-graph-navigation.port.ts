/**
 * Knowledge Graph Navigation Port - Inbound port for ESG knowledge graph navigation
 * 
 * 职责：
 * - 定义知识图谱导航的用例接口
 * - 提供框架、分类、指标的查询能力
 * - 支持层次化数据导航
 */

import { Framework, BaseResponse } from '@esg-platform/dto';

/**
 * 报告框架信息
 */
export interface FrameworkInfo {
  code: Framework;
  name: string;
  description?: string | undefined;
}

/**
 * 分类信息
 */
export interface CategoryInfo {
  code: string;
  name: string;
  description?: string | undefined;
  framework: Framework;
  industry: string;
}

/**
 * 指标信息
 */
export interface MetricInfo {
  code: string;
  name: string;
  description?: string | undefined;
  category: string;
  framework: Framework;
  industry: string;
  unitIri?: string | undefined;
}

/**
 * 知识图谱导航端口接口
 */
export interface KnowledgeGraphNavigationPort {
  /**
   * 获取指定行业适用的报告框架
   * 
   * @param industry 行业名称
   * @returns 适用的报告框架列表
   */
  getFrameworksByIndustry(industry: string): Promise<BaseResponse<FrameworkInfo[]>>;

  /**
   * 获取指定行业和框架下的分类
   * 
   * @param industry 行业名称
   * @param framework 报告框架
   * @returns 分类列表
   */
  getCategoriesByIndustryAndFramework(
    industry: string, 
    framework: Framework
  ): Promise<BaseResponse<CategoryInfo[]>>;

  /**
   * 获取指定分类下的指标
   * 
   * @param industry 行业名称
   * @param framework 报告框架
   * @param categoryLabel 分类标签
   * @returns 指标列表
   */
  getMetricsByCategory(
    industry: string,
    framework: Framework,
    categoryLabel: string
  ): Promise<BaseResponse<MetricInfo[]>>;
}