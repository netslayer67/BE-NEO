// 📁 src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@/models/user.model';
import { ApiError } from '@/errors/apiError';
import { IUser } from '@/types';

export interface IRequest extends Request {
  user?: IUser;
}

export const protect = async (req: IRequest, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return next(new ApiError(401, 'Not authorized, user not found.'));
      }
      next();
    } catch (error) {
      return next(new ApiError(401, 'Not authorized, token failed.'));
    }
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, no token.'));
  }
};

export const admin = (req: IRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ApiError(403, 'Not authorized as an admin.'));
  }
};