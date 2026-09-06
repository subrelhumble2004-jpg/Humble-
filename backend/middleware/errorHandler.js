function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  console.error("❌ Server Error:", err);

  // MySQL duplicate entry
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists."
    });
  }

  // MySQL foreign-key constraint
  if (
    err.code === "ER_ROW_IS_REFERENCED_2" ||
    err.code === "ER_ROW_IS_REFERENCED"
  ) {
    return res.status(409).json({
      success: false,
      message:
        "This record cannot be deleted because it is currently being used."
    });
  }

  // MySQL foreign-key constraint on insert/update
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      success: false,
      message:
        "The requested record references data that does not exist."
    });
  }

  // CORS errors
  if (
    typeof err.message === "string" &&
    err.message.startsWith("CORS:")
  ) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed."
    });
  }

  const statusCode =
    Number(err.statusCode) >= 400 &&
    Number(err.statusCode) < 600
      ? Number(err.statusCode)
      : 500;

  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error."
      : err.message || "Internal server error.";

  const response = {
    success: false,
    message
  };

  // Stack traces are useful only during development.
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  notFound,
  errorHandler,
  ApiError
};
