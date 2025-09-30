#!/usr/bin/env node
import { createApp } from './app';
import { config } from './config/config';
async function main() {
    try {
        const app = createApp(config);
        const server = app.listen(config.port, () => {
            console.log(`🚀 ESG Platform Public API started`);
            console.log(`📍 Environment: ${config.nodeEnv}`);
            console.log(`🌐 Server: http://localhost:${config.port}`);
            console.log(`📚 API Docs: http://localhost:${config.port}/api/docs`);
            console.log(`🔍 Health Check: http://localhost:${config.port}/api/health`);
            console.log(`📖 OpenAPI Spec: http://localhost:${config.port}/api/v1/openapi.json`);
            if (config.nodeEnv === 'development') {
                console.log(`\n🛠️  Development Mode Features:`);
                console.log(`   • Authentication: Mock (no real JWT validation)`);
                console.log(`   • Database: Mock implementations`);
                console.log(`   • Rate Limiting: Development settings`);
                console.log(`   • CORS: Permissive settings`);
            }
            console.log(`\n📊 Configuration:`);
            console.log(`   • Port: ${config.port}`);
            console.log(`   • Log Level: ${config.logLevel}`);
            console.log(`   • Rate Limit: ${config.rateLimitMax} requests per ${config.rateLimitWindowMs}ms`);
            console.log(`   • Computation Timeout: ${config.computationTimeoutMs}ms`);
            console.log(`   • CORS Origins: ${config.corsOrigins.join(', ')}`);
        });
        const gracefulShutdown = (signal) => {
            console.log(`\n📥 Received ${signal}. Starting graceful shutdown...`);
            server.close((err) => {
                if (err) {
                    console.error('❌ Error during graceful shutdown:', err);
                    process.exit(1);
                }
                console.log('✅ HTTP server closed');
                console.log('👋 ESG Platform Public API shut down gracefully');
                process.exit(0);
            });
            setTimeout(() => {
                console.error('⚠️  Forced shutdown due to timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
export { main };
//# sourceMappingURL=main.js.map