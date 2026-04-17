'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Typography } from '@mui/material';
import { useNotesStore } from '@/app/stores/useNotesStore';

export const NoteLinkView = ({ node }: { node: { attrs: Record<string, unknown> } }) => {
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const noteId = node.attrs.noteId as string;
  const noteTitle = node.attrs.noteTitle as string;

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <Typography
        component="span"
        onClick={() => setActiveNote(noteId)}
        sx={{
          color: 'primary.main',
          cursor: 'pointer',
          fontWeight: 500,
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          '&:hover': { textDecorationStyle: 'solid' },
        }}>
        {noteTitle}
      </Typography>
    </NodeViewWrapper>
  );
};
