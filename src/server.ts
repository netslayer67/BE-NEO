import 'module-alias/register';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './api';
import connectDB from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1', apiRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});