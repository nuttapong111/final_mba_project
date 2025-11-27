import { hash, compare } from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return compare(password, hashedPassword);
};


