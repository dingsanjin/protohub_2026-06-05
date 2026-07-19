import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByUsername, findUserByEmail, createUser as createUserRepo } from '../repositories/userRepository';
import type { User, JwtPayload } from '../types';

export async function login(identifier: string, password: string): Promise<{ user: User; token: string } | null> {
  let user = await findUserByUsername(identifier);
  
  if (!user) {
    user = await findUserByEmail(identifier);
  }
  
  if (!user || user.status !== 'active') {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  return { user, token };
}

export async function register(username: string, password: string): Promise<User> {
  const existingUser = await findUserByUsername(username);
  
  if (existingUser) {
    throw new Error('用户名已存在');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return createUserRepo({
    username,
    password: hashedPassword,
    role: 'admin',
    status: 'active',
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}
