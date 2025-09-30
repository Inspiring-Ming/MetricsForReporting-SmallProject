import { v4 as uuidv4 } from 'uuid';
export function requestLogger(req, res, next) {
    req.requestId = req.headers['x-request-id'] || uuidv4();
    req.startTime = Date.now();
    res.setHeader('X-Request-ID', req.requestId);
    console.log('HTTP Request', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    });
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        const level = res.statusCode >= 500 ? 'error' :
            res.statusCode >= 400 ? 'warn' : 'info';
        console.log('HTTP Response', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('content-length'),
            timestamp: new Date().toISOString(),
            level
        });
    });
    next();
}
export function performanceMonitor(req, res, next) {
    const startTime = process.hrtime();
    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const durationMs = seconds * 1000 + nanoseconds / 1e6;
        if (durationMs > 1000) {
            console.warn('Slow Request', {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                duration: `${durationMs.toFixed(2)}ms`,
                statusCode: res.statusCode
            });
        }
        res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
    });
    next();
}
export function securityHeaders(_req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    next();
}
export function corsHandler(req, res, next) {
    const config = req.app.get('config');
    const allowedOrigins = config?.corsOrigins || ['http://localhost:3000'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key');
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Response-Time');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
}
//# sourceMappingURL=requestLogger.js.map