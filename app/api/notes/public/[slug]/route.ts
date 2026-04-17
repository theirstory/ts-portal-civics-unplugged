import { NextRequest, NextResponse } from 'next/server';
import { getNoteByPublicSlug } from '@/lib/notes';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const note = await getNoteByPublicSlug(slug);
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  return NextResponse.json({ note });
}
