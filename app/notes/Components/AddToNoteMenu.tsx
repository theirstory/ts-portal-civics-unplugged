'use client';

import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useNotesStore } from '@/app/stores/useNotesStore';

interface AddToNoteMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
  onCreateNew: () => void;
}

export const AddToNoteMenu = ({ anchorEl, onClose, onSelectNote, onCreateNew }: AddToNoteMenuProps) => {
  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (anchorEl && !loaded) {
      fetchNotes().then(() => setLoaded(true));
    }
  }, [anchorEl, loaded, fetchNotes]);

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { maxHeight: 300, minWidth: 220 } } }}>
      <MenuItem
        onClick={() => {
          onCreateNew();
          onClose();
        }}>
        <ListItemIcon>
          <AddIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="New note" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} />
      </MenuItem>
      {notes.length > 0 && <Divider />}
      {!loaded && notes.length === 0 && (
        <MenuItem disabled>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </MenuItem>
      )}
      {notes.slice(0, 20).map((note) => (
        <MenuItem
          key={note.id}
          onClick={() => {
            onSelectNote(note.id);
            onClose();
          }}>
          <ListItemIcon>
            <DescriptionOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={note.title || 'Untitled'}
            primaryTypographyProps={{ fontSize: '0.85rem', noWrap: true }}
          />
        </MenuItem>
      ))}
    </Menu>
  );
};
