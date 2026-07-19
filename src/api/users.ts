import { get, post, put, del } from './axios';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types';

export async function getUserList(): Promise<User[]> {
  const response = await get<{ data: User[] }>('/users');
  return response.data;
}

export async function getUserById(id: number): Promise<User> {
  const response = await get<{ data: User }>(`/users/${id}`);
  return response.data;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await post<{ data: User }>('/users', data);
  return response.data;
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<User> {
  const response = await put<{ data: User }>(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await del(`/users/${id}`);
}
