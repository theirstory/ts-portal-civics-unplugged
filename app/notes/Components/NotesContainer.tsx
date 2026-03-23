'use client';

import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { NotesSidebar } from './NotesSidebar';
import { NoteEditor } from './NoteEditor';
import { useNotesStore } from '@/app/stores/useNotesStore';

export const NotesContainer = () => {
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const fetchFolders = useNotesStore((s) => s.fetchFolders);

  useEffect(() => {
    fetchNotes();
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        overflow: 'hidden',
        height: '100%',
      }}>
      <NotesSidebar />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <NoteEditor />
      </Box>
    </Box>
  );
};
