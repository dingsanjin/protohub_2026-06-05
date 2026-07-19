import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getAllUsers, findUserById, updateUser as updateUserRepo, deleteUser as deleteUserRepo, createUser as createUserRepo } from '../repositories/userRepository';
import type { User } from '../types';

export async function getUsers(req: Request, res: Response) {
  const users = await getAllUsers();
  
  const sanitizedUsers = users.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));

  res.json({ success: true, data: sanitizedUsers });
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await findUserById(Number(id));

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  });
}

export async function createUser(req: Request, res: Response) {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await createUserRepo({
      username,
      password: hashedPassword,
      email,
      role: 'admin',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch {
    res.status(409).json({ success: false, message: '用户名已存在' });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { username, password, status, email } = req.body;

  const updates: Partial<User> = {};
  
  if (username) updates.username = username;
  if (status) updates.status = status as User['status'];
  if (password) updates.password = await bcrypt.hash(password, 10);
  if (email !== undefined) updates.email = email;

  const user = await updateUserRepo(Number(id), updates);

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  
  if (req.user?.id === Number(id)) {
    return res.status(400).json({ success: false, message: '不能删除自己' });
  }

  const user = await findUserById(Number(id));
  
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  await deleteUserRepo(Number(id));

  res.json({ success: true, message: '删除成功' });
}
