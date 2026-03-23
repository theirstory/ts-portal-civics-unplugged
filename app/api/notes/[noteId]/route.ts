import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNoteById, updateNote, deleteNote } from '@/lib/notes';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { noteId } = await params;
  const note = await getNoteById(noteId);

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  if (note.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ note });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { noteId } = await params;
  const existing = await getNoteById(noteId);
  if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  if (existing.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const note = await updateNote(noteId, body);

  if (!note) return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  return NextResponse.json({ note });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { noteId } = await params;
  const existing = await getNoteById(noteId);
  if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  if (existing.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const success = await deleteNote(noteId);
  if (!success) return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  return NextResponse.json({ success: true });
}
