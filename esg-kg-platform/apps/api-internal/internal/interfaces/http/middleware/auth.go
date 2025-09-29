// Package middleware provides HTTP middleware functions for the internal API
package middleware

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"
)

// AuthContext represents the authenticated user context
type AuthContext struct {
	Sub    string   `json:"sub"`
	Scopes []string `json:"scopes"`
	Issuer string   `json:"issuer"`
	Exp    int64    `json:"exp"`
	IsDev  bool     `json:"is_dev"`
}

// Context key for auth context
type contextKey string

const AuthContextKey contextKey = "auth"

// AuthMiddleware creates an authentication middleware
//
// 🔧 LOCAL DEVELOPMENT MODE:
// - Authentication is completely disabled (AUTH_ENABLED=false)
// - All requests pass through without validation
// - No JWT tokens required
//
// For production use, implement:
// - JWT token validation
// - Scope-based authorization
// - User context injection
func AuthMiddleware(requiredScopes ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check if auth is enabled from environment
			authEnabled := os.Getenv("AUTH_ENABLED") == "true"

			if !authEnabled {
				// Development mode: inject mock auth context
				mockAuth := &AuthContext{
					Sub:    "dev-user",
					Scopes: []string{"read:metrics", "query:graph", "validate:data"},
					Issuer: "dev-mode",
					Exp:    time.Now().Add(24 * time.Hour).Unix(),
					IsDev:  true,
				}

				// Inject auth context into request context
				ctx := context.WithValue(r.Context(), AuthContextKey, mockAuth)
				r = r.WithContext(ctx)

				log.Printf("[DEV-AUTH] Authentication bypassed in development mode - User: %s, Scopes: %v, Required: %v",
					mockAuth.Sub, mockAuth.Scopes, requiredScopes)

				// Continue to next handler
				next.ServeHTTP(w, r)
				return
			}

			// TODO: Future production implementation
			// 1. Extract JWT from Authorization header
			// 2. Validate JWT signature and expiry
			// 3. Check required scopes against user scopes
			// 4. Inject user context into request
			// 5. Call next handler or return appropriate error

			http.Error(w, "Production authentication not yet implemented", http.StatusNotImplemented)
		})
	}
}

// NoAuthMiddleware for public endpoints (health checks, metrics)
func NoAuthMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Always pass through for public endpoints
			next.ServeHTTP(w, r)
		})
	}
}

// GetAuthContext extracts the auth context from the request
func GetAuthContext(r *http.Request) (*AuthContext, bool) {
	ctx := r.Context().Value(AuthContextKey)
	if ctx == nil {
		return nil, false
	}
	
	authCtx, ok := ctx.(*AuthContext)
	return authCtx, ok
}

// RequireScope checks if the authenticated user has the required scope
func RequireScope(r *http.Request, scope string) bool {
	authCtx, ok := GetAuthContext(r)
	if !ok {
		return false
	}

	// In dev mode, allow everything
	if authCtx.IsDev {
		return true
	}

	// Check if user has required scope
	for _, userScope := range authCtx.Scopes {
		if userScope == scope {
			return true
		}
	}
	
	return false
}