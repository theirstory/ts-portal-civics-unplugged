import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Note, NoteFolder } from '@/types/note';

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

type NotesStore = {
  notes: Note[];
  folders: NoteFolder[];
  activeNoteId: string | null;
  loading: boolean;
  saving: boolean;

  fetchNotes: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  createNote: (title?: string, folderId?: string | null) => Promise<Note | null>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  setActiveNote: (noteId: string | null) => void;
  createFolder: (name: string, parentId?: string | null, color?: string | null) => Promise<NoteFolder | null>;
  updateFolder: (folderId: string, updates: Partial<NoteFolder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  setSaving: (saving: boolean) => void;
  /** Append TipTap JSON nodes to an existing note's content */
  appendToNote: (noteId: string, nodes: TipTapNode[]) => Promise<void>;
  /** Create a new note pre-populated with TipTap JSON content */
  createNoteWithContent: (title: string, nodes: TipTapNode[]) => Promise<Note | null>;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useNotesStore = create<NotesStore>()(
  devtools(
    (set, get) => ({
      notes: [],
      folders: [],
      activeNoteId: null,
      loading: false,
      saving: false,

      fetchNotes: async () => {
        set({ loading: true }, false, 'fetchNotes:start');
        try {
          const res = await fetch('/api/notes');
          if (!res.ok) throw new Error('Failed to fetch notes');
          const { notes } = await res.json();
          set({ notes, loading: false }, false, 'fetchNotes:done');
        } catch {
          set({ loading: false }, false, 'fetchNotes:error');
        }
      },

      fetchFolders: async () => {
        try {
          const res = await fetch('/api/notes/folders');
          if (!res.ok) throw new Error('Failed to fetch folders');
          const { folders } = await res.json();
          set({ folders }, false, 'fetchFolders:done');
        } catch {
          // silently fail
        }
      },

      createNote: async (title?: string, folderId?: string | null) => {
        try {
          const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, folderId }),
          });
          if (!res.ok) throw new Error('Failed to create note');
          const { note } = await res.json();
          set(
            (state) => ({
              notes: [note, ...state.notes],
              activeNoteId: note.id,
            }),
            false,
            'createNote',
          );
          return note;
        } catch {
          return null;
        }
      },

      updateNote: async (noteId: string, updates: Partial<Note>) => {
        // Optimistic local update
        set(
          (state) => ({
            notes: state.notes.map((n) =>
              n.id === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
            ),
          }),
          false,
          'updateNote:optimistic',
        );

        // Debounced save to server
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          set({ saving: true }, false, 'updateNote:saving');
          try {
            const res = await fetch(`/api/notes/${noteId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update note');
            const { note } = await res.json();
            set(
              (state) => ({
                notes: state.notes.map((n) => (n.id === noteId ? note : n)),
                saving: false,
              }),
              false,
              'updateNote:done',
            );
          } catch {
            set({ saving: false }, false, 'updateNote:error');
          }
        }, 1500);
      },

      deleteNote: async (noteId: string) => {
        set(
          (state) => ({
            notes: state.notes.filter((n) => n.id !== noteId),
            activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
          }),
          false,
          'deleteNote:optimistic',
        );
        try {
          await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
        } catch {
          // Re-fetch on error
          get().fetchNotes();
        }
      },

      setActiveNote: (noteId: string | null) => {
        set({ activeNoteId: noteId }, false, 'setActiveNote');
      },

      createFolder: async (name: string, parentId?: string | null, color?: string | null) => {
        try {
          const res = await fetch('/api/notes/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentId, color }),
          });
          if (!res.ok) throw new Error('Failed to create folder');
          const { folder } = await res.json();
          set((state) => ({ folders: [...state.folders, folder] }), false, 'createFolder');
          return folder;
        } catch {
          return null;
        }
      },

      updateFolder: async (folderId: string, updates: Partial<NoteFolder>) => {
        try {
          const res = await fetch(`/api/notes/folders/${folderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error('Failed to update folder');
          const { folder } = await res.json();
          set(
            (state) => ({
              folders: state.folders.map((f) => (f.id === folderId ? folder : f)),
            }),
            false,
            'updateFolder',
          );
        } catch {
          // silently fail
        }
      },

      deleteFolder: async (folderId: string) => {
        set(
          (state) => ({
            folders: state.folders.filter((f) => f.id !== folderId),
            notes: state.notes.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n)),
          }),
          false,
          'deleteFolder:optimistic',
        );
        try {
          await fetch(`/api/notes/folders/${folderId}`, { method: 'DELETE' });
        } catch {
          get().fetchFolders();
        }
      },

      appendToNote: async (noteId: string, nodes: TipTapNode[]) => {
        const note = get().notes.find((n) => n.id === noteId);
        if (!note) return;

        // Merge nodes into existing content
        const existing = (note.content as { type?: string; content?: TipTapNode[] }) || {};
        const existingNodes = existing.content || [];
        const newContent = {
          type: 'doc',
          content: [...existingNodes, ...nodes],
        };

        await get().updateNote(noteId, { content: newContent as Record<string, unknown> });
      },

      createNoteWithContent: async (title: string, nodes: TipTapNode[]) => {
        const note = await get().createNote(title);
        if (!note) return null;

        const content = { type: 'doc', content: nodes };
        await get().updateNote(note.id, { content: content as Record<string, unknown> });
        return note;
      },

      setSaving: (saving: boolean) => set({ saving }, false, 'setSaving'),
    }),
    { name: 'Notes Store' },
  ),
);
