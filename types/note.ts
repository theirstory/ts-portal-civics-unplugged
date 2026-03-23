export type Note = {
  id: string;
  ownerId: string;
  title: string;
  content: Record<string, unknown>;
  contentMarkdown: string;
  folderId: string | null;
  color: string | null;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteFolder = {
  id: string;
  ownerId: string;
  name: string;
  parentId: string | null;
  color: string | null;
  sortOrder: number;
  createdAt: string;
};
