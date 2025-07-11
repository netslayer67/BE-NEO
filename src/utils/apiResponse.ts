// 📁 src/utils/apiResponse.ts
import { Response } from 'express';

export class ApiResponse {
  constructor(res: Response, statusCode: number, message: string, data?: any) {
    res.status(statusCode).json({
      success: statusCode < 400,
      message,
      data,
    });
  }
}