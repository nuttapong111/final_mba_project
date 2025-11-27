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
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN,
  };
  
  return sign(payload, secret, options);
};


