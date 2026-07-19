import { Request, Response } from 'express';
import { login, register } from '../services/authService';

export async function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const result = await login(username, password);

  if (!result) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const { user, token } = result;

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      token,
    },
  });
}

export async function handleRegister(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
  }

  try {
    const user = await register(username, password);
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === '用户名已存在') {
      return res.status(409).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: '注册失败' });
  }
}

export async function handleLogout(req: Request, res: Response) {
  res.json({ success: true, message: '已退出登录' });
}
