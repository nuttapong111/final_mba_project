import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
}

export interface SchoolContext {
  id: string;
  name: string;
  domain: string;
  subscription: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    school?: SchoolContext;
    schoolId?: string;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verify(token, env.JWT_SECRET) as AuthUser;
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
};

export const roleMiddleware = (...allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    
    await next();
  };
};


