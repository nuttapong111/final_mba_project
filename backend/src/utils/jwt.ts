import { sign, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const secret = env.JWT_SECRET;
  // JWT_EXPIRES_IN is a string like "7d", which is valid for SignOptions
  const options = {
    expiresIn: env.JWT_EXPIRES_IN,
  } satisfies SignOptions;
  
  return sign(payload, secret, options);
};


