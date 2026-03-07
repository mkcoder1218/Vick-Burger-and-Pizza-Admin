import { fetcher, HttpError } from './fetcher';

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'chef' | 'waiter';
  businessId?: string;
  businessIds?: string[];
  businesses?: { id: string; businessName: string }[];
  business?: { id: string; businessName: string } | null;
  profileFileId?: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data: { token: string; user?: AuthUser | { id: string; name: string; email: string; role: string; businessId?: string | null; businessIds?: string[]; businesses?: { id: string; businessName: string }[]; business?: { id: string; businessName: string } | null; profileFileId?: string | null } };
};

const TOKEN_KEY = 'vick_admin_token';

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): { userId: string; role: string; businessId?: string | null } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function login(payload: LoginPayload) {
  return fetcher<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe() {
  return fetcher<{ success: boolean; data: AuthUser | { id: string; name: string; email: string; role: string; businessId?: string | null; businessIds?: string[]; businesses?: { id: string; businessName: string }[]; business?: { id: string; businessName: string } | null; profileFileId?: string | null } }>('/auth/me');
}

export async function updateMe(payload: { name?: string; profileFileId?: string | null }) {
  return fetcher<{ success: boolean; data: AuthUser | { id: string; name: string; email: string; role: string; businessId?: string | null; businessIds?: string[]; businesses?: { id: string; businessName: string }[]; business?: { id: string; businessName: string } | null; profileFileId?: string | null } }>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function buildUserFromToken(token: string, emailFallback: string): AuthUser | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  const roleMap: Record<string, AuthUser['role']> = {
    'Super Admin': 'super_admin',
    'SuperAdmin': 'super_admin',
    'Admin': 'admin',
    'Manager': 'manager',
    'Chef': 'chef',
    'Waiter': 'waiter',
    'super_admin': 'super_admin',
    'admin': 'admin',
    'manager': 'manager',
    'chef': 'chef',
    'waiter': 'waiter',
  };

  const role = roleMap[decoded.role] ?? 'chef';
  return {
    id: decoded.userId,
    name: emailFallback.split('@')[0] || 'User',
    email: emailFallback,
    role,
    businessId: decoded.businessId ?? undefined,
    businessIds: decoded.businessId ? [decoded.businessId] : undefined,
  };
}

export function normalizeRole(role: string): AuthUser['role'] {
  const roleMap: Record<string, AuthUser['role']> = {
    'Super Admin': 'super_admin',
    'SuperAdmin': 'super_admin',
    'Admin': 'admin',
    'Manager': 'manager',
    'Chef': 'chef',
    'Waiter': 'waiter',
    'super_admin': 'super_admin',
    'admin': 'admin',
    'manager': 'manager',
    'chef': 'chef',
    'waiter': 'waiter',
  };
  return roleMap[role] ?? 'chef';
}

export function normalizeUser(user: { id: string; name: string; email: string; role: string; businessId?: string | null; businessIds?: string[]; businesses?: { id: string; businessName: string }[]; business?: { id: string; businessName: string } | null; profileFileId?: string | null }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    businessId: user.businessId ?? undefined,
    businessIds: user.businessIds ?? undefined,
    businesses: user.businesses ?? undefined,
    business: user.business ?? undefined,
    profileFileId: user.profileFileId ?? undefined,
  };
}

export function getErrorMessage(err: unknown) {
  if (err instanceof HttpError) {
    if (typeof err.info === 'string' && err.info) return err.info;
    if (err.info && typeof err.info === 'object') {
      const msg = (err.info as any).message || (err.info as any).error;
      if (typeof msg === 'string' && msg) return msg;
    }
    return err.message || 'Request failed';
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as any).message;
    if (typeof msg === 'string' && msg) return msg;
  }

  return 'Something went wrong. Please try again.';
}
