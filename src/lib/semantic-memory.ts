import { randomUUID } from 'crypto';

const QDRANT_URL = process.env.QDRANT_URL?.replace(/\/$/, '');
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? 'manasmitra_memory';
const GOOGLE_API_KEY = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GOOGLE_API_KEY;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 768;

export interface MemoryTurnInput {
  memoryKey: string;
  text: string;
  kind?: 'user' | 'assistant' | 'note';
  metadata?: Record<string, unknown>;
}

export interface MemoryHit {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

export interface MemorySystemHealth {
  configured: boolean;
  qdrantReachable: boolean;
  collectionExists: boolean | null;
  collectionName: string;
  embeddingConfigured: boolean;
  details?: string;
}

function hasQdrantConfig() {
  return Boolean(QDRANT_URL && QDRANT_API_KEY);
}

function hasEmbeddingConfig() {
  return Boolean(GOOGLE_API_KEY);
}

export async function getMemorySystemHealth(): Promise<MemorySystemHealth> {
  if (!hasQdrantConfig()) {
    return {
      configured: false,
      qdrantReachable: false,
      collectionExists: null,
      collectionName: QDRANT_COLLECTION,
      embeddingConfigured: hasEmbeddingConfig(),
      details: 'Qdrant env vars are missing.',
    };
  }

  try {
    const response = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    if (response.ok) {
      return {
        configured: true,
        qdrantReachable: true,
        collectionExists: true,
        collectionName: QDRANT_COLLECTION,
        embeddingConfigured: hasEmbeddingConfig(),
      };
    }

    if (response.status === 404) {
      return {
        configured: true,
        qdrantReachable: true,
        collectionExists: false,
        collectionName: QDRANT_COLLECTION,
        embeddingConfigured: hasEmbeddingConfig(),
        details: 'Collection does not exist yet and will be created on first write.',
      };
    }

    return {
      configured: true,
      qdrantReachable: true,
      collectionExists: null,
      collectionName: QDRANT_COLLECTION,
      embeddingConfigured: hasEmbeddingConfig(),
      details: `Qdrant responded with status ${response.status}.`,
    };
  } catch (error) {
    return {
      configured: true,
      qdrantReachable: false,
      collectionExists: null,
      collectionName: QDRANT_COLLECTION,
      embeddingConfigured: hasEmbeddingConfig(),
      details: error instanceof Error ? error.message : 'Unknown Qdrant connection error.',
    };
  }
}

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}),
  };
}

function normalizeVector(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return values;
  }

  return values.map((value) => value / magnitude);
}

function prepareQueryText(text: string) {
  return `task: retrieval query | query: ${text}`;
}

function prepareDocumentText(text: string) {
  return `task: retrieval document | title: conversation turn | text: ${text}`;
}

async function embedText(text: string, mode: 'query' | 'document'): Promise<number[] | null> {
  if (!hasEmbeddingConfig()) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: mode === 'query' ? prepareQueryText(text) : prepareDocumentText(text) }],
        },
        task_type: mode === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
        output_dimensionality: EMBEDDING_DIMENSION,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding request failed with status ${response.status}`);
  }

  const data = await response.json();
  const vector = data?.embedding?.values as number[] | undefined;

  if (!vector || !Array.isArray(vector)) {
    throw new Error('Embedding response did not include a vector.');
  }

  return normalizeVector(vector);
}

async function ensureCollection() {
  if (!hasQdrantConfig()) {
    return false;
  }

  const response = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (response.ok) {
    return true;
  }

  if (response.status !== 404) {
    throw new Error(`Qdrant collection check failed with status ${response.status}`);
  }

  const createResponse = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify({
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: 'Cosine',
      },
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Qdrant collection creation failed with status ${createResponse.status}`);
  }

  return true;
}

export async function storeMemoryTurn(input: MemoryTurnInput) {
  if (!hasQdrantConfig() || !hasEmbeddingConfig()) {
    return;
  }

  await ensureCollection();

  const vector = await embedText(input.text, 'document');

  if (!vector) {
    return;
  }

  await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points?wait=true`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify({
      points: [
        {
          id: randomUUID(),
          vector,
          payload: {
            memoryKey: input.memoryKey,
            kind: input.kind ?? 'note',
            text: input.text,
            createdAt: new Date().toISOString(),
            ...(input.metadata ?? {}),
          },
        },
      ],
    }),
  });
}

export async function searchRelevantMemory(memoryKey: string, query: string, limit = 4): Promise<MemoryHit[]> {
  if (!hasQdrantConfig() || !hasEmbeddingConfig()) {
    return [];
  }

  await ensureCollection();

  const vector = await embedText(query, 'query');

  if (!vector) {
    return [];
  }

  const filter = {
    must: [
      {
        key: 'memoryKey',
        match: {
          value: memoryKey,
        },
      },
    ],
  };

  const searchResponse = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      vector,
      limit,
      with_payload: true,
      filter,
    }),
  });

  let response = searchResponse;

  // Some Qdrant deployments prefer /points/query with "query" over /points/search.
  if (!response.ok && (response.status === 400 || response.status === 404)) {
    response = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/query`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        query: vector,
        limit,
        with_payload: true,
        filter,
      }),
    });
  }

  if (!response.ok) {
    const details = await response.text().catch(() => 'No response body');
    throw new Error(`Qdrant search failed with status ${response.status}: ${details}`);
  }

  const data = await response.json();
  const matches = Array.isArray(data?.result) ? data.result : [];

  return matches
    .map((match: any) => ({
      id: String(match.id),
      score: typeof match.score === 'number' ? match.score : 0,
      text: String(match.payload?.text ?? ''),
      metadata: match.payload ?? {},
    }))
    .filter((match: MemoryHit) => match.text.trim().length > 0);
}

export async function buildMemoryContext(memoryKey: string, query: string) {
  try {
    const hits = await searchRelevantMemory(memoryKey, query);

    if (!hits.length) {
      return '';
    }

    return hits
      .map((hit, index) => `${index + 1}. ${hit.text}`)
      .join('\n');
  } catch (error) {
    console.error('Failed to build memory context:', error);
    return '';
  }
}

export async function recordConversationMemory(memoryKey: string, userText: string, assistantText: string) {
  const combinedText = `User asked: ${userText}\nAssistant replied: ${assistantText}`;

  await storeMemoryTurn({
    memoryKey,
    text: combinedText,
    kind: 'assistant',
    metadata: {
      source: 'voice-agent',
    },
  });
}
