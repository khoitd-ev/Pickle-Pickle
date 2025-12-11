class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(msg, details) {
    return new HttpError(400, msg, details);
  }

  static unauthorized(msg, details) {
    return new HttpError(401, msg, details);
  }

  static forbidden(msg, details) {
    return new HttpError(403, msg, details);
  }

  static notFound(msg, details) {
    return new HttpError(404, msg, details);
  }
}

export { HttpError };
