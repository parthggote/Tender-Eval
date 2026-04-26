'use server';

import { revalidatePath } from 'next/cache';
import { createHmac } from 'crypto';
import { dedupedAuth } from '@workspace/auth';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:8000'}/api/v1`;

export async function createAgencyAction(formData: FormData): Promise<void> {
  const session = await dedupedAuth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret')
    .update(`${session.user.id}.${timestamp}`)
    .digest('hex');

  const response = await fetch(`${API_BASE_URL}/agencies`, {
    method: 'POST',
    headers: {
      'X-User-Id': session.user.id,
      'X-User-Timestamp': timestamp,
      'X-User-Signature': signature,
    },
    body: formData, // Send as multipart/form-data
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create agency');
  }

  revalidatePath('/agencies');
}
