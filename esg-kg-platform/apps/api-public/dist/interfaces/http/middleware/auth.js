export const createAuthMiddleware = (requiredScopes = []) => {
    return (request, _response, next) => {
        const authEnabled = process?.env?.AUTH_ENABLED === 'true';
        if (!authEnabled) {
            const mockAuth = {
                sub: 'dev-user',
                scopes: ['write:metrics', 'validate:metrics', 'read:metrics'],
                issuer: 'dev-mode',
                exp: Date.now() + 24 * 60 * 60 * 1000,
                isDev: true
            };
            if (request) {
                request.auth = mockAuth;
                request.user = mockAuth;
            }
            console.log('[DEV-AUTH] Authentication bypassed in development mode', {
                mockUser: mockAuth.sub,
                mockScopes: mockAuth.scopes,
                requiredScopes
            });
            if (next)
                next();
            return;
        }
        const error = new Error('Production authentication not yet implemented');
        if (next) {
            next(error);
        }
        else {
            throw error;
        }
    };
};
export const noAuthRequired = () => {
    return (_request, _response, next) => {
        if (next)
            next();
    };
};
export default createAuthMiddleware;
//# sourceMappingURL=auth.js.map