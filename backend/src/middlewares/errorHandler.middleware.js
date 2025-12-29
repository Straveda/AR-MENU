export const errorHandler = (err, req, res, next) => {
  console.error("Global Error Handler Caught:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Production Safety: Don't leak stack traces
  const response = {
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
        ? "Something went wrong on our end." 
        : message
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
