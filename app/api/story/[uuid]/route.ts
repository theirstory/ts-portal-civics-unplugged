import { NextRequest, NextResponse } from 'next/server';
import { fetchStoryTranscriptByUuid } from '@/lib/weaviate/search';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;

  if (!uuid) {
    return NextResponse.json({ error: 'uuid required' }, { status: 400 });
  }

  try {
    const result = await fetchStoryTranscriptByUuid(uuid);
    if (!result) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error fetching story by uuid:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
