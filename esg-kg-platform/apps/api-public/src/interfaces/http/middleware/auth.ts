/**
 * Authentication middleware - Development mode placeholder
 * 
 * 🔧 LOCAL DEVELOPMENT MODE:
 * - Authentication is completely disabled (AUTH_ENABLED=false)
 * - All requests pass through without validation
 * - No JWT tokens required
 * 
 * For production use, implement:
 * - JWT token validation  
 * - Scope-based authorization
 * - User context injection
 */

export interface AuthContext {
  sub: string;
  scopes: string[];
  issuer: string;
  exp: number;
  isDev?: boolean;
}

/**
 * Development mode auth middleware - bypasses all authentication
 * 
 * Usage:
 * - Returns a middleware function that can be used with any framework
 * - In development mode (AUTH_ENABLED=false), always allows access
 * - In production mode, throws error (requires implementation)
 */
export const createAuthMiddleware = (requiredScopes: string[] = []) => {
  return (request: any, _response: any, next?: Function): void => {
    // Check if auth is enabled from environment
    const authEnabled = process?.env?.AUTH_ENABLED === 'true';
    
    if (!authEnabled) {
      // Development mode: inject mock auth context
      const mockAuth: AuthContext = {
        sub: 'dev-user',
        scopes: ['write:metrics', 'validate:metrics', 'read:metrics'],
        issuer: 'dev-mode',
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        isDev: true
      };
      
      // Inject auth context into request (works with most frameworks)
      if (request) {
        request.auth = mockAuth;
        request.user = mockAuth; // Alternative property name
      }
      
      console.log('[DEV-AUTH] Authentication bypassed in development mode', {
        mockUser: mockAuth.sub,
        mockScopes: mockAuth.scopes,
        requiredScopes
      });
      
      // Continue to next middleware/handler
      if (next) next();
      return;
    }

    // TODO: Future production implementation
    // 1. Extract JWT from Authorization header
    // 2. Validate JWT signature and expiry  
    // 3. Check required scopes against user scopes
    // 4. Inject user context into request
    // 5. Call next() or return appropriate error
    
    const error = new Error('Production authentication not yet implemented');
    if (next) {
      next(error);
    } else {
      throw error;
    }
  };
};

/**
 * No-auth middleware for public endpoints (health checks, docs)
 */
export const noAuthRequired = () => {
  return (_request: any, _response: any, next?: Function): void => {
    // Always pass through
    if (next) next();
  };
};

// Default export for backwards compatibility
export default createAuthMiddleware;