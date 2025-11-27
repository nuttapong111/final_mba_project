import { sign } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  // @ts-ignore - JWT_EXPIRES_IN string format like "7d" is valid for jsonwebtoken
  return sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};


