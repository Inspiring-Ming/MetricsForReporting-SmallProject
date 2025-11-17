import dotenv from 'dotenv';
import path from 'path';

// 加载测试环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// 设置测试超时
jest.setTimeout(30000);

// 全局测试配置
beforeAll(() => {
  console.log('\n🧪 Starting Industry API Test Suite...');
  console.log(`📊 GraphDB URL: ${process.env.GRAPHDB_URL}`);
  console.log(`📦 Repository: ${process.env.GRAPHDB_REPO}\n`);
});

afterAll(() => {
  console.log('\n✅ Test Suite Completed\n');
});
