const mongoose = require('mongoose');
const createRouter = require('./contentRouteFactory');
module.exports = createRouter('workoutPlans', (req) => {
  const errors = [];
  if (!mongoose.isValidObjectId(req.body.customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' });
  if (typeof req.body.title !== 'string' || !req.body.title.trim()) errors.push({ field: 'title', message: 'Vui lòng nhập tên giáo án.' });
  if (!Array.isArray(req.body.sessions)) errors.push({ field: 'sessions', message: 'Danh sách buổi tập không hợp lệ.' });
  else req.body.sessions.forEach((session, sessionIndex) => {
    if (typeof session.name !== 'string' || !session.name.trim()) errors.push({ field: `sessions.${sessionIndex}.name`, message: 'Vui lòng nhập tên buổi tập.' });
    if (!Array.isArray(session.exercises)) errors.push({ field: `sessions.${sessionIndex}.exercises`, message: 'Danh sách bài tập không hợp lệ.' });
    else session.exercises.forEach((exercise, exerciseIndex) => {
      if (typeof exercise.name !== 'string' || !exercise.name.trim()) errors.push({ field: `sessions.${sessionIndex}.exercises.${exerciseIndex}.name`, message: 'Vui lòng nhập tên bài tập.' });
      if (exercise.sets != null && (!Number.isInteger(exercise.sets) || exercise.sets < 1)) errors.push({ field: `sessions.${sessionIndex}.exercises.${exerciseIndex}.sets`, message: 'Số hiệp phải là số nguyên lớn hơn 0.' });
    });
  });
  for (const field of ['startDate', 'endDate']) if (req.body[field] && Number.isNaN(Date.parse(req.body[field]))) errors.push({ field, message: `${field} không hợp lệ.` });
  return errors;
});
