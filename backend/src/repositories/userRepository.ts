import db from '../database/connection';
import type { User } from '../types';

export async function findUserByUsername(username: string): Promise<User | undefined> {
  return db('users').where('username', username).first();
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db('users').where('email', email).first();
}

export async function findUserById(id: number): Promise<User | undefined> {
  return db('users').where('id', id).first();
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  const [result] = await db('users').insert(user).returning('*');
  return result;
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
  const [result] = await db('users').where('id', id).update(updates).returning('*');
  return result;
}

export async function deleteUser(id: number): Promise<void> {
  await db('users').where('id', id).del();
}

export async function getAllUsers(): Promise<User[]> {
  return db('users').select('*');
}
