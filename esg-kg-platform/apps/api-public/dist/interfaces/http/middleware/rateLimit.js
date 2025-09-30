import rateLimit from 'express-rate-limit';
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        type: 'rate_limit_exceeded',
        title: 'Too Many Requests',
        status: 429,
        detail: 'Too many requests from this IP, please try again later.',
        instance: '/api',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
});
export const writeOperationRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: {
        type: 'write_rate_limit_exceeded',
        title: 'Too Many Write Operations',
        status: 429,
        detail: 'Too many write operations from this IP, please slow down.',
        instance: '/api',
        timestamp: new Date().toISOString()
    },
    skip: (req) => {
        return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    },
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
});
export const heavyOperationRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: {
        type: 'computation_rate_limit_exceeded',
        title: 'Too Many Heavy Operations',
        status: 429,
        detail: 'Too many computation requests from this IP, please wait before trying again.',
        instance: '/api/computations',
        timestamp: new Date().toISOString()
    },
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
});
export const createAuthAwareRateLimit = (anonymousLimit, authenticatedLimit, windowMs = 15 * 60 * 1000) => {
    return rateLimit({
        windowMs,
        max: (req) => {
            const isAuthenticated = req.headers.authorization || req.auth;
            return isAuthenticated ? authenticatedLimit : anonymousLimit;
        },
        message: (req) => ({
            type: 'rate_limit_exceeded',
            title: 'Rate Limit Exceeded',
            status: 429,
            detail: `Rate limit exceeded for ${req.auth ? 'authenticated' : 'anonymous'} users.`,
            instance: req.path,
            timestamp: new Date().toISOString()
        }),
        keyGenerator: (req) => {
            const userId = req.auth?.sub;
            return userId || req.ip || req.connection.remoteAddress || 'unknown';
        }
    });
};
const idempotencyCache = new Map();
export function idempotencyHandler(req, res, next) {
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !idempotencyKey) {
        return next();
    }
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached && cached.expiresAt > Date.now()) {
        console.log('Idempotency hit', {
            key: idempotencyKey,
            path: req.path,
            method: req.method
        });
        res.status(200).json({
            ...cached.response,
            _idempotent: true,
            timestamp: new Date().toISOString()
        });
        return;
    }
    const originalJson = res.json.bind(res);
    res.json = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            idempotencyCache.set(idempotencyKey, {
                response: data,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000
            });
            if (Math.random() < 0.01) {
                const now = Date.now();
                for (const [key, value] of idempotencyCache.entries()) {
                    if (value.expiresAt <= now) {
                        idempotencyCache.delete(key);
                    }
                }
            }
        }
        return originalJson(data);
    };
    next();
}
//# sourceMappingURL=rateLimit.js.map