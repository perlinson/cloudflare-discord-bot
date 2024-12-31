import { APIError } from '../utils/helpers.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger({ prefix: 'ErrorHandler' });

export async function errorHandler(request, env, ctx, next) {
  try {
    return await next();
  } catch (error) {
    logger.error('Error handling request:', error);

    if (error instanceof APIError) {
      return new Response(
        JSON.stringify({
          error: true,
          code: error.code,
          message: error.message,
        }),
        {
          status: error.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: true,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
