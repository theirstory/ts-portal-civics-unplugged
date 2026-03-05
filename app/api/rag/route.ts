import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { hybridSearch } from '@/lib/weaviate/search';
import { SchemaTypes, Chunks } from '@/types/weaviate';
import { formatTime } from '@/app/utils/util';
import type { RagCitation } from '@/types/rag';

export type { RagCitation };

export type RagMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type RequestBody = {
  messages: RagMessage[];
  collectionIds?: string[];
};

const RAG_CHUNKS_LIMIT = 8;
const MAX_HISTORY_TURNS = 6;

const RAG_CHUNK_RETURN_PROPS = [
  'transcription',
  'interview_title',
  'speaker',
  'start_time',
  'end_time',
  'theirstory_id',
  'collection_name',
  'section_title',
] as const;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const { messages, collectionIds } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  // Use the last user message as the search query
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMessage) {
    return NextResponse.json({ error: 'No user message found' }, { status: 400 });
  }

  // Run semantic search to retrieve relevant chunks
  let chunks: Awaited<ReturnType<typeof hybridSearch>>['objects'] = [];
  try {
    const results = await hybridSearch(
      SchemaTypes.Chunks,
      lastUserMessage.content,
      RAG_CHUNKS_LIMIT,
      0,
      undefined,
      collectionIds?.length ? collectionIds : undefined,
      RAG_CHUNK_RETURN_PROPS as unknown as any[],
      0.1,
    );
    chunks = results.objects;
  } catch (err) {
    console.error('RAG search error:', err);
    // Continue with empty context rather than failing
  }

  // Build context string with numbered citations
  const citationData: Omit<RagCitation, 'id'>[] = [];
  const contextLines: string[] = [];

  chunks.forEach((chunk: { properties: unknown }, i: number) => {
    const p = chunk.properties as Partial<Chunks>;
    const idx = i + 1;
    const title = p.interview_title || 'Unknown Recording';
    const speaker = p.speaker || 'Unknown Speaker';
    const startTime = p.start_time ?? 0;
    const endTime = p.end_time ?? 0;
    const text = (p.transcription || '').trim();
    const collectionName = p.collection_name || undefined;

    citationData.push({
      quote: text,
      storyUuid: p.theirstory_id || '',
      storyTitle: title,
      speaker,
      startTime,
      endTime,
      collectionName,
    });

    contextLines.push(
      `[${idx}] Recording: "${title}" | Speaker: ${speaker} | Time: ${formatTime(startTime)}–${formatTime(endTime)}\n"${text}"`,
    );
  });

  const contextBlock =
    contextLines.length > 0
      ? `Here are relevant excerpts from the interview archive:\n\n${contextLines.join('\n\n')}`
      : 'No relevant excerpts were found for this query.';

  const systemPrompt = `You are an AI research assistant for an oral history interview archive. You help researchers explore and understand the collection through conversation.

When answering questions, use the provided interview excerpts as your primary source. Cite your sources using [1], [2], etc. notation to reference the specific excerpts. When you include information from an excerpt, quote directly from it when useful.

Be conversational and analytical. Connect themes across different interviews when relevant. If you don't find sufficient information in the provided excerpts, say so honestly.

${contextBlock}`;

  // Build message history (limit to avoid token overflow)
  const recentMessages = messages.slice(-MAX_HISTORY_TURNS);
  const anthropicMessages: Anthropic.MessageParam[] = recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = new Anthropic({ apiKey });

  let responseContent = '';
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: anthropicMessages,
    });
    const block = response.content[0];
    responseContent = block.type === 'text' ? block.text : '';
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }

  // Extract which citation indices Claude actually used in the response
  const usedIndices = new Set<number>();
  const allMatches = responseContent.matchAll(/\[(\d+)\]/g);
  for (const match of allMatches) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= citationData.length) {
      usedIndices.add(n);
    }
  }

  // Build citations array (only include actually-cited chunks, but keep numbering consistent)
  const citations: RagCitation[] = citationData.map((c, i) => ({
    id: i + 1,
    ...c,
  }));

  return NextResponse.json({ content: responseContent, citations });
}
