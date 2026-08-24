const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { success } = require('./middlewares/response');
const { errorHandler } = require('./middlewares/errorHandler');
const path = require('path');
const { registerFrontend } = require('./services/frontendService');
const { requestContext } = require('./middlewares/requestContext');
const { AppError } = require('./errors/AppError');
const { ERROR_CODES } = require('./errors/errorCodes');

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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/inbody', require('./routes/inbody'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/workout-plans', require('./routes/workoutPlans'));
app.use('/api/nutrition-plans', require('./routes/nutritionPlans'));
app.use('/api/me', require('./routes/me'));
app.use('/api/nutrition', require('./routes/nutrition'));
app.use('/api/upload', require('./routes/upload'));

app.use('/api', (req, res, next) => next(new AppError({ status: 404, code: ERROR_CODES.ROUTE_NOT_FOUND, message: 'Không tìm thấy đường dẫn API.' })));

const frontendPath = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, '../dist') : path.resolve(__dirname, '../frontend');
app.frontendReady = process.env.NODE_ENV === 'test' ? Promise.resolve(false) : registerFrontend(app, frontendPath);
app.use(errorHandler);

module.exports = app;
