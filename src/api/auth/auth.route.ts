import { Router } from 'express';
import { registerHandler, loginHandler } from './auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);

export default router;