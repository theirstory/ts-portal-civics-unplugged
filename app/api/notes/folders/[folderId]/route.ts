import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateFolder, deleteFolder } from '@/lib/notes';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { folderId } = await params;
  const body = await request.json();
  const folder = await updateFolder(folderId, body);

  if (!folder) return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  return NextResponse.json({ folder });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { folderId } = await params;
  const success = await deleteFolder(folderId);

  if (!success) return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  return NextResponse.json({ success: true });
}
