/**
 * 环境变量配置
 */
export const config = {
  // 服务器配置
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // GraphDB 配置
  GRAPHDB_URL: process.env.GRAPHDB_URL || 'http://localhost:7200',
  GRAPHDB_REPO: process.env.GRAPHDB_REPO || 'esg-repo',
  DEFAULT_GRAPH: process.env.DEFAULT_GRAPH, // 可选命名图
  
  // 安全配置
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // 日志配置
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

/**
 * RDF 前缀定义
 */
export const PREFIXES = [
  '@prefix esg:  <http://example.org/esg#> .',
  '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
  '@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .',
].join('\n');

/**
 * 验证必需的环境变量
 */
export const validateConfig = () => {
  const requiredEnvVars = ['GRAPHDB_URL', 'GRAPHDB_REPO'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] && envVar !== 'GRAPHDB_URL' && envVar !== 'GRAPHDB_REPO') {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  
  console.log('Configuration validated successfully');
  console.log(`Server will run on port ${config.PORT}`);
  console.log(`GraphDB URL: ${config.GRAPHDB_URL}`);
  console.log(`GraphDB Repository: ${config.GRAPHDB_REPO}`);
};