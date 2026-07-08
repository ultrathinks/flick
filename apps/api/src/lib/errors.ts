import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends HTTPException {
  readonly code: string;

  constructor(status: ContentfulStatusCode, code: string, message: string) {
    super(status, { message });
    this.code = code;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, "BAD_REQUEST", message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(400, "VALIDATION", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class PaymentExpiredError extends AppError {
  constructor(message = "Payment expired") {
    super(404, "PAYMENT_EXPIRED", message);
  }
}

export class PaymentNotPendingError extends AppError {
  constructor(message = "Payment is not pending") {
    super(400, "PAYMENT_NOT_PENDING", message);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message = "Insufficient balance") {
    super(400, "INSUFFICIENT_BALANCE", message);
  }
}

export class OutOfStockError extends AppError {
  constructor(message = "Out of stock") {
    super(400, "OUT_OF_STOCK", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, "CONFLICT", message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(429, "TOO_MANY_REQUESTS", message);
  }
}
