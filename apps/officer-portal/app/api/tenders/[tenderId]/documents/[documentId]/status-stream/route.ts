import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { dedupedAuth } from '@workspace/auth';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:8000'}/api/v1`;

export async function GET(
  _req: NextRequest,
  { params }: { params: { tenderId: string; documentId: string } }
) {
  const session = await dedupedAuth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { tenderId, documentId } = params;
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret')
    .update(`${session.user.id}.${timestamp}`)
    .digest('hex');

  const upstream = await fetch(
    `${API_BASE_URL}/tenders/${tenderId}/documents/${documentId}/status-stream`,
    {
      headers: {
        'X-User-Id': session.user.id,
        'X-User-Timestamp': timestamp,
        'X-User-Signature': signature,
        Accept: 'text/event-stream',
      },
    }
  );

  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to connect to status stream', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}
