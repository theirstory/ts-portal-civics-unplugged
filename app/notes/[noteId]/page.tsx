'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { NotesContainer } from '../Components/NotesContainer';
import { useNotesStore } from '@/app/stores/useNotesStore';

export default function NotePage() {
  const params = useParams();
  const noteId = params.noteId as string;
  const setActiveNote = useNotesStore((s) => s.setActiveNote);

  useEffect(() => {
    if (noteId) {
      setActiveNote(noteId);
    }
  }, [noteId, setActiveNote]);

  return <NotesContainer />;
}
