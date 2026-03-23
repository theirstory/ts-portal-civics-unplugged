'use client';

import React, { useState } from 'react';
import { Box, Typography, IconButton, TextField, Button, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SearchIcon from '@mui/icons-material/Search';
import { useNotesStore } from '@/app/stores/useNotesStore';
import { NoteFolderTree } from './NoteFolderTree';

export const NotesSidebar = () => {
  const notes = useNotesStore((s) => s.notes);
  const folders = useNotesStore((s) => s.folders);
  const createNote = useNotesStore((s) => s.createNote);
  const createFolder = useNotesStore((s) => s.createFolder);
  const loading = useNotesStore((s) => s.loading);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const filteredNotes = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.contentMarkdown.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : notes;

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  };

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 280 },
        minWidth: { md: 280 },
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: '0.05em' }}>
          NOTES
        </Typography>
        <Box>
          <Tooltip title="New folder">
            <IconButton size="small" onClick={() => setShowNewFolder(!showNewFolder)}>
              <CreateNewFolderIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="New note">
            <IconButton size="small" onClick={() => createNote()}>
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* New folder input */}
      {showNewFolder && (
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', gap: 0.5 }}>
          <TextField
            size="small"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') setShowNewFolder(false);
            }}
            autoFocus
            sx={{ flex: 1, '& input': { fontSize: 13, py: 0.5 } }}
          />
          <Button size="small" variant="contained" onClick={handleCreateFolder} sx={{ minWidth: 0, px: 1 }}>
            <AddIcon sx={{ fontSize: 16 }} />
          </Button>
        </Box>
      )}

      {/* Search */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <TextField
          size="small"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />,
            sx: { fontSize: 13 },
          }}
          sx={{ '& input': { py: 0.5 } }}
        />
      </Box>

      {/* Notes tree */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Typography variant="body2" sx={{ px: 1.5, py: 2, color: 'text.secondary', textAlign: 'center' }}>
            Loading...
          </Typography>
        ) : filteredNotes.length === 0 && folders.length === 0 ? (
          <Box sx={{ px: 1.5, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No notes yet
            </Typography>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => createNote()}>
              Create your first note
            </Button>
          </Box>
        ) : searchQuery ? (
          // Flat list when searching
          <Box>
            {filteredNotes.map((note) => (
              <NoteListItem key={note.id} note={note} />
            ))}
          </Box>
        ) : (
          <NoteFolderTree folders={folders} notes={filteredNotes} />
        )}
      </Box>
    </Box>
  );
};

// Simple flat note list item for search results
import CircleIcon from '@mui/icons-material/Circle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Note } from '@/types/note';

const NoteListItem = ({ note }: { note: Note }) => {
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        py: 0.5,
        cursor: 'pointer',
        bgcolor: activeNoteId === note.id ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: activeNoteId === note.id ? 'action.selected' : 'action.hover' },
        '&:hover .note-actions': { opacity: 1 },
      }}
      onClick={() => setActiveNote(note.id)}>
      {note.color && <CircleIcon sx={{ fontSize: 10, color: note.color, mr: 0.75 }} />}
      <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8125rem' }} noWrap>
        {note.title || 'Untitled'}
      </Typography>
      <IconButton
        size="small"
        className="note-actions"
        sx={{ opacity: 0, p: 0.25 }}
        onClick={(e) => {
          e.stopPropagation();
          deleteNote(note.id);
        }}>
        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};
