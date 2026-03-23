import { Note, NoteFolder } from '@/types/note';

async function getSupabase() {
  const { createServerSupabaseClient } = await import('./supabase/server');
  return createServerSupabaseClient();
}

// --- Notes ---

export async function getNotesByOwner(ownerId: string): Promise<Note[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapNote);
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('notes').select('*').eq('id', noteId).single();

  if (error || !data) return null;
  return mapNote(data);
}

export async function createNote(ownerId: string, title?: string, folderId?: string | null): Promise<Note | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      owner_id: ownerId,
      title: title || 'Untitled',
      folder_id: folderId || null,
    })
    .select('*')
    .single();

  if (error || !data) return null;
  return mapNote(data);
}

export async function updateNote(
  noteId: string,
  updates: Partial<{
    title: string;
    content: Record<string, unknown>;
    contentMarkdown: string;
    folderId: string | null;
    color: string | null;
    isPublic: boolean;
    publicSlug: string | null;
  }>,
): Promise<Note | null> {
  const supabase = await getSupabase();

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.contentMarkdown !== undefined) dbUpdates.content_markdown = updates.contentMarkdown;
  if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
  if (updates.publicSlug !== undefined) dbUpdates.public_slug = updates.publicSlug;

  const { data, error } = await supabase.from('notes').update(dbUpdates).eq('id', noteId).select('*').single();

  if (error || !data) return null;
  return mapNote(data);
}

export async function deleteNote(noteId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  return !error;
}

// --- Folders ---

export async function getFoldersByOwner(ownerId: string): Promise<NoteFolder[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('note_folders')
    .select('*')
    .eq('owner_id', ownerId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(mapFolder);
}

export async function createFolder(
  ownerId: string,
  name: string,
  parentId?: string | null,
  color?: string | null,
): Promise<NoteFolder | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('note_folders')
    .insert({
      owner_id: ownerId,
      name,
      parent_id: parentId || null,
      color: color || null,
    })
    .select('*')
    .single();

  if (error || !data) return null;
  return mapFolder(data);
}

export async function updateFolder(
  folderId: string,
  updates: Partial<{ name: string; parentId: string | null; color: string | null; sortOrder: number }>,
): Promise<NoteFolder | null> {
  const supabase = await getSupabase();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { data, error } = await supabase.from('note_folders').update(dbUpdates).eq('id', folderId).select('*').single();

  if (error || !data) return null;
  return mapFolder(data);
}

export async function deleteFolder(folderId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('note_folders').delete().eq('id', folderId);
  return !error;
}

// --- Mappers ---

function mapNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    title: row.title as string,
    content: (row.content as Record<string, unknown>) || {},
    contentMarkdown: (row.content_markdown as string) || '',
    folderId: (row.folder_id as string) || null,
    color: (row.color as string) || null,
    isPublic: (row.is_public as boolean) || false,
    publicSlug: (row.public_slug as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapFolder(row: Record<string, unknown>): NoteFolder {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    name: row.name as string,
    parentId: (row.parent_id as string) || null,
    color: (row.color as string) || null,
    sortOrder: (row.sort_order as number) || 0,
    createdAt: row.created_at as string,
  };
}
