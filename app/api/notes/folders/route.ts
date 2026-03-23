import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFoldersByOwner, createFolder } from '@/lib/notes';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const folders = await getFoldersByOwner(user.id);
  return NextResponse.json({ folders });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });

  const folder = await createFolder(user.id, body.name, body.parentId, body.color);

  if (!folder) return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  return NextResponse.json({ folder }, { status: 201 });
}
