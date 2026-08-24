function success(res, { message, data = null, meta, status = 200 }) {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

function fail(res, { message, errors, status = 400 }) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

module.exports = { success, fail };
