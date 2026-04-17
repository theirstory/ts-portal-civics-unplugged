'use client';

import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CheckIcon from '@mui/icons-material/Check';
import { Citation } from '@/types/chat';
import { useNotesStore } from '@/app/stores/useNotesStore';
import { AddToNoteMenu } from '@/app/notes/Components/AddToNoteMenu';
import { citationToTranscriptEmbed } from '@/app/notes/utils/chatToNote';

interface AddCitationToNoteProps {
  citation: Citation;
  size?: 'small' | 'medium';
}

export const AddCitationToNote = ({ citation, size = 'small' }: AddCitationToNoteProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [added, setAdded] = useState(false);
  const appendToNote = useNotesStore((s) => s.appendToNote);
  const createNoteWithContent = useNotesStore((s) => s.createNoteWithContent);

  const embedNode = citationToTranscriptEmbed(citation);

  const handleSelectNote = async (noteId: string) => {
    await appendToNote(noteId, [embedNode]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleCreateNew = async () => {
    const title = `${citation.speaker} — ${citation.interviewTitle}`;
    await createNoteWithContent(title, [embedNode]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <Tooltip title={added ? 'Added to note!' : 'Add to note'}>
        <IconButton
          size={size}
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          sx={{ p: size === 'small' ? 0.25 : 0.5 }}>
          {added ? (
            <CheckIcon sx={{ fontSize: size === 'small' ? 16 : 20, color: 'success.main' }} />
          ) : (
            <NoteAddIcon sx={{ fontSize: size === 'small' ? 16 : 20 }} />
          )}
        </IconButton>
      </Tooltip>
      <AddToNoteMenu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onSelectNote={handleSelectNote}
        onCreateNew={handleCreateNew}
      />
    </>
  );
};
