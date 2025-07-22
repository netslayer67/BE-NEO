// src/app.ts

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import apiRoutes from './api';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Setup CORS whitelist
const allowedOrigins = [
  'http://localhost:5173',
  'https://radiantrage.vercel.app',
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Create express app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', apiRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
