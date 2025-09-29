export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: UserProfile;
  expiresAt?: string;
  permissions?: Permission[];
}

export interface ApiKeyRequest {
  name: string;
  permissions: Permission[];
  expiresAt?: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string;
  permissions: Permission[];
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}
