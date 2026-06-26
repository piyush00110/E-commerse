import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (id: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'],
  };
  return jwt.sign({ id, role }, env.JWT_SECRET, options);
};
