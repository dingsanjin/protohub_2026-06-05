import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err);
  
  if (err instanceof Error) {
    return res.status(500).json({
      success: false,
      message: err.message || '服务器内部错误',
    });
  }

  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
  });
}
