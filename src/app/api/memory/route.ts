import { NextResponse } from 'next/server';
import { buildMemoryContext, recordConversationMemory, storeMemoryTurn } from '@/lib/semantic-memory';

type MemoryActionBody =
  | {
      action: 'search';
      memoryKey: string;
      query: string;
    }
  | {
      action: 'store';
      memoryKey: string;
      text: string;
      kind?: 'user' | 'assistant' | 'note';
      metadata?: Record<string, unknown>;
    }
  | {
      action: 'pair';
      memoryKey: string;
      userText: string;
      assistantText: string;
    };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MemoryActionBody;

    if (!body.action || !body.memoryKey?.trim()) {
      return NextResponse.json({ error: 'Missing memory action or memory key.' }, { status: 400 });
    }

    if (body.action === 'search') {
      const context = await buildMemoryContext(body.memoryKey, body.query);
      return NextResponse.json({ context });
    }

    if (body.action === 'store') {
      await storeMemoryTurn({
        memoryKey: body.memoryKey,
        text: body.text,
        kind: body.kind ?? 'note',
        metadata: body.metadata,
      });

      return NextResponse.json({ ok: true });
    }

    await recordConversationMemory(body.memoryKey, body.userText, body.assistantText);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Memory route error:', error);
    return NextResponse.json({ error: 'Failed to process memory request.' }, { status: 500 });
  }
}
