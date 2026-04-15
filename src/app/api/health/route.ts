import { NextResponse } from 'next/server';
import { getMemorySystemHealth } from '@/lib/semantic-memory';

export async function GET() {
  const memoryHealth = await getMemorySystemHealth();

  return NextResponse.json({
    status: memoryHealth.configured && memoryHealth.qdrantReachable ? 'ok' : 'degraded',
    memory: memoryHealth,
  });
}
