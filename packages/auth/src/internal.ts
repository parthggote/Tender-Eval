import { createHmac } from 'crypto';

import { keys } from '../keys';

export type SignedUserContextHeaders = {
  'X-User-Id': string;
  'X-User-Timestamp': string;
  'X-User-Signature': string;
};

export function createSignedUserContextHeaders(
  userId: string,
  now = new Date()
): SignedUserContextHeaders {
  const timestamp = String(now.getTime());
  const signature = createHmac('sha256', keys().AUTH_SECRET)
    .update(`${userId}.${timestamp}`)
    .digest('hex');

  return {
    'X-User-Id': userId,
    'X-User-Timestamp': timestamp,
    'X-User-Signature': signature
  };
}

