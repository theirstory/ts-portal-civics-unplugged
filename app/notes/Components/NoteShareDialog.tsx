'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Switch,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useNotesStore } from '@/app/stores/useNotesStore';

interface NoteShareDialogProps {
  open: boolean;
  onClose: () => void;
}

function generateSlug(title: string): string {
  return (
    (title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled') +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}

export const NoteShareDialog = ({ open, onClose }: NoteShareDialogProps) => {
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const notes = useNotesStore((s) => s.notes);
  const updateNote = useNotesStore((s) => s.updateNote);
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;
  const [copied, setCopied] = useState(false);

  if (!activeNote) return null;

  const publicUrl = activeNote.publicSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/notes/public/${activeNote.publicSlug}`
    : '';

  const handleToggle = async () => {
    if (!activeNoteId) return;
    const newIsPublic = !activeNote.isPublic;
    const newSlug = newIsPublic && !activeNote.publicSlug ? generateSlug(activeNote.title) : activeNote.publicSlug;

    await updateNote(activeNoteId, {
      isPublic: newIsPublic,
      publicSlug: newIsPublic ? newSlug : activeNote.publicSlug,
    });
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          Share Note
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body1" fontWeight={600}>
              Public access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Anyone with the link can view this note
            </Typography>
          </Box>
          <Switch checked={activeNote.isPublic} onChange={handleToggle} />
        </Box>

        {activeNote.isPublic && publicUrl && (
          <TextField
            fullWidth
            size="small"
            value={publicUrl}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={handleCopy}
                      startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                      sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
