import { Router } from 'express';
import { createHealthRoutes } from './healthRoutes';
import { createSparqlRoutes } from './sparqlRoutes';
import { createWizardRoutes } from './wizardRoutes';
import { createTTLRoutes } from './ttlRoutes';
import { createShaclRoutes } from './shaclRoutes';
import { createKnowledgeGraphRoutes } from './knowledgeGraphRoutes';
import { createMetricComputationRoutes } from './metricComputationRoutes';
import { createMetricRoutes } from './metricRoutes';
import { createIndustryRoutes } from './kg_routers/industryRoutes';
import { createFrameworkRoutes } from './kg_routers/frameworkRoutes';
import { createCategoryRoutes } from './kg_routers/categoryRoutes';
import { createMetricRoutes as createKGMetricRoutes } from './kg_routers/metricRoutes';
import { createImplementationRoutes } from './kg_routers/implementationRoutes';
import { createDatasetVariableRoutes } from './kg_routers/datasetVariableRoutes';
import { createDatasourceRoutes } from './kg_routers/datasourceRoutes';

/**
 * 主路由配置 - 整合所有子路由
 */
export const createApiRoutes = (): Router => {
  const router = Router();

  // 路由前缀和子路由映射
  router.use('/', createHealthRoutes());
  router.use('/sparql', createSparqlRoutes());
  router.use('/wizard', createWizardRoutes());
  router.use('/upload-ttl', createTTLRoutes());
  router.use('/shacl', createShaclRoutes());
  
  // KG 子资源路由需要在通用 KG 路由之前注册（更具体的路由优先）
  router.use('/kg/industries', createIndustryRoutes());
  router.use('/kg/frameworks', createFrameworkRoutes());
  router.use('/kg/categories', createCategoryRoutes());
  router.use('/kg/metrics', createKGMetricRoutes());
  router.use('/kg/implementations', createImplementationRoutes());
  router.use('/kg/dataset-variables', createDatasetVariableRoutes());
  router.use('/kg/datasources', createDatasourceRoutes());
  router.use('/kg', createKnowledgeGraphRoutes());
  
  router.use('/computation', createMetricComputationRoutes());
  
  /**
   * @deprecated /api/metric/* routes are deprecated
   * Use /api/kg/metrics/* instead
   * Will be removed in v2.0.0 (June 2026)
   */
  router.use('/metric', createMetricRoutes());

  return router;
};