import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';

export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await registerUser(req.body);
    return new ApiResponse(res, 201, 'User registered successfully', { user, token });
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await loginUser(req.body);
    return new ApiResponse(res, 200, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};