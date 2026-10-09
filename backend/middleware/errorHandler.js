/**
 * Central error handler. Route/controller code should `next(err)`
 * (optionally with `err.statusCode` set) instead of formatting error
 * responses inline.
 */
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not found: ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("SERVER ERROR:", err);
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
