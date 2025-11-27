import { sign } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};


