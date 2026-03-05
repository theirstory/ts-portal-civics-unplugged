import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/weaviate/search';
import { SchemaTypes, Chunks } from '@/types/weaviate';
import type { RagSearchResult } from '@/types/rag';

export type { RagSearchResult };

type RequestBody = {
  query: string;
  collectionIds?: string[];
  limit?: number;
};

const SEARCH_RETURN_PROPS = [
  'transcription',
  'interview_title',
  'speaker',
  'start_time',
  'end_time',
  'theirstory_id',
  'section_title',
  'collection_name',
] as const;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const { query, collectionIds, limit = 10 } = body;

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  try {
    const results = await hybridSearch(
      SchemaTypes.Chunks,
      query,
      limit,
      0,
      undefined,
      collectionIds?.length ? collectionIds : undefined,
      SEARCH_RETURN_PROPS as unknown as any[],
      0.1,
    );

    const searchResults: RagSearchResult[] = results.objects.map((obj) => {
      const p = obj.properties as Partial<Chunks>;
      return {
        storyUuid: p.theirstory_id || '',
        storyTitle: p.interview_title || 'Unknown Recording',
        speaker: p.speaker || 'Unknown Speaker',
        startTime: p.start_time ?? 0,
        endTime: p.end_time ?? 0,
        excerpt: (p.transcription || '').trim(),
        score: obj.metadata?.score ?? 0,
        sectionTitle: p.section_title || undefined,
        collectionName: p.collection_name || undefined,
      };
    });

    return NextResponse.json({ results: searchResults });
  } catch (err) {
    console.error('RAG search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
