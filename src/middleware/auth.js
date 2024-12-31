import { verifyDiscordRequest } from '../utils/discord-verify.js';
import { APIError } from '../utils/helpers.js';

export async function authMiddleware(request, env, ctx, next) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');

  if (!signature || !timestamp) {
    throw new APIError('Missing signature headers', 'UNAUTHORIZED', 401);
  }

  const body = await request.clone().text();
  const isValid = await verifyDiscordRequest(
    env.DISCORD_PUBLIC_KEY,
    signature,
    timestamp,
    body
  );

  if (!isValid) {
    throw new APIError('Invalid signature', 'UNAUTHORIZED', 401);
  }

  return next();
}
