export interface AuthContext {
    sub: string;
    scopes: string[];
    issuer: string;
    exp: number;
    isDev?: boolean;
}
export declare const createAuthMiddleware: (requiredScopes?: string[]) => (request: any, _response: any, next?: Function) => void;
export declare const noAuthRequired: () => (_request: any, _response: any, next?: Function) => void;
export default createAuthMiddleware;
//# sourceMappingURL=auth.d.ts.map