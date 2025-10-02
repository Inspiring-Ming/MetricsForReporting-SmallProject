import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 记录错误日志
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // 如果是自定义应用错误
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  // 处理其他类型的错误
  let statusCode = 500;
  let message = 'Internal Server Error';

  // 检查是否有 status 属性（来自旧代码的兼容性）
  if ('status' in error && typeof (error as any).status === 'number') {
    statusCode = (error as any).status;
  }

  // 在开发环境下显示详细错误信息
  if (process.env.NODE_ENV === 'development') {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error
      })
    }
  });
};

/**
 * 404 错误处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * 异步路由错误处理包装器
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};