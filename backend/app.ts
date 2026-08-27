import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { success } from './middlewares/response.js';
import { errorHandler } from './middlewares/errorHandler.js';
import path from 'path';
import { registerFrontend } from './services/frontendService.js';
import { requestContext } from './middlewares/requestContext.js';
import { AppError } from './errors/AppError.js';
import { ERROR_CODES } from './errors/errorCodes.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import customersRouter from './routes/customers.js';
import transfersRouter from './routes/transfers.js';
import inbodyRouter from './routes/inbody.js';
import goalsRouter from './routes/goals.js';
import workoutPlansRouter from './routes/workoutPlans.js';
import nutritionPlansRouter from './routes/nutritionPlans.js';
import meRouter from './routes/me.js';
import nutritionRouter from './routes/nutrition.js';
import uploadRouter from './routes/upload.js';
const app = express();

app.use(requestContext);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => success(res, {
  message: 'Hệ thống hoạt động bình thường.',
  data: { status: 'ok' },
}));
app.get('/api/health/live', (req, res) => success(res, { message: 'Tiến trình đang hoạt động.', data: { status: 'live' } }));
app.get('/api/health/ready', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return success(res, { message: 'Hệ thống sẵn sàng phục vụ.', data: { status: 'ready' } });
  return next(new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Hệ thống chưa sẵn sàng phục vụ.' }));
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/inbody', inbodyRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/workout-plans', workoutPlansRouter);
app.use('/api/nutrition-plans', nutritionPlansRouter);
app.use('/api/me', meRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/upload', uploadRouter);

app.use('/api', (req, res, next) => next(new AppError({ status: 404, code: ERROR_CODES.ROUTE_NOT_FOUND, message: 'Không tìm thấy đường dẫn API.' })));

const frontendPath = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, '../dist') : path.resolve(__dirname, '../frontend');
app.frontendReady = process.env.NODE_ENV === 'test' ? Promise.resolve(false) : registerFrontend(app, frontendPath);
app.use(errorHandler);

export default app;
