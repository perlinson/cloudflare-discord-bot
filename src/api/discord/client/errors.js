export class DiscordAPIError extends Error {
  constructor(error, status) {
    super(error.message || 'An error occurred with the Discord API');
    this.name = 'DiscordAPIError';
    this.code = error.code;
    this.status = status;
    this.errors = error.errors;
    this.httpStatus = status;
    
    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DiscordAPIError);
    }
  }

  get isClientError() {
    return this.httpStatus >= 400 && this.httpStatus < 500;
  }

  get isServerError() {
    return this.httpStatus >= 500;
  }

  get isRateLimited() {
    return this.httpStatus === 429;
  }
}

export class DiscordRateLimitError extends DiscordAPIError {
  constructor(error, status, retryAfter) {
    super(error, status);
    this.name = 'DiscordRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class DiscordAuthenticationError extends DiscordAPIError {
  constructor(error, status) {
    super(error, status);
    this.name = 'DiscordAuthenticationError';
  }
}

export class DiscordPermissionError extends DiscordAPIError {
  constructor(error, status) {
    super(error, status);
    this.name = 'DiscordPermissionError';
  }
}
