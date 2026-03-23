import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNotesByOwner, createNote } from '@/lib/notes';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const notes = await getNotesByOwner(user.id);
  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const note = await createNote(user.id, body.title, body.folderId);

  if (!note) return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  return NextResponse.json({ note }, { status: 201 });
}
