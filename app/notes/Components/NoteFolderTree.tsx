'use client';

import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { NoteFolder, Note } from '@/types/note';
import { useNotesStore } from '@/app/stores/useNotesStore';

interface NoteFolderTreeProps {
  folders: NoteFolder[];
  notes: Note[];
  parentId?: string | null;
  depth?: number;
}

export const NoteFolderTree = ({ folders, notes, parentId = null, depth = 0 }: NoteFolderTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const deleteFolder = useNotesStore((s) => s.deleteFolder);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const updateNote = useNotesStore((s) => s.updateNote);

  const childFolders = folders.filter((f) => f.parentId === parentId);
  const folderNotes = notes.filter((n) => n.folderId === parentId);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleNoteDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      updateNote(noteId, { folderId });
    }
  };

  return (
    <Box>
      {childFolders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id);
        const isDragOver = dragOverFolderId === folder.id;
        return (
          <Box key={folder.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                pl: depth * 2,
                py: 0.5,
                px: 1,
                cursor: 'pointer',
                bgcolor: isDragOver ? 'action.selected' : 'transparent',
                outline: isDragOver ? '2px solid' : 'none',
                outlineColor: 'primary.main',
                borderRadius: isDragOver ? 0.5 : 0,
                '&:hover': { bgcolor: isDragOver ? 'action.selected' : 'action.hover' },
                '&:hover .folder-actions': { opacity: 1 },
              }}
              onClick={() => toggleFolder(folder.id)}
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={handleFolderDragLeave}
              onDrop={(e) => {
                handleFolderDrop(e, folder.id);
                // Auto-expand folder when dropping into it
                setExpandedFolders((prev) => new Set(prev).add(folder.id));
              }}>
              {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
              <FolderIcon sx={{ fontSize: 18, ml: 0.5, color: folder.color || 'text.secondary' }} />
              <Typography variant="body2" sx={{ ml: 0.75, flex: 1, fontWeight: 500, fontSize: '0.8125rem' }} noWrap>
                {folder.name}
              </Typography>
              <IconButton
                size="small"
                className="folder-actions"
                sx={{ opacity: 0, p: 0.25 }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFolder(folder.id);
                }}>
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            <Collapse in={isExpanded}>
              <Box sx={{ ml: depth * 2 + 1.5, borderLeft: '1.5px solid', borderColor: 'divider' }}>
                <NoteFolderTree folders={folders} notes={notes} parentId={folder.id} depth={0} />
              </Box>
            </Collapse>
          </Box>
        );
      })}

      {folderNotes.map((note) => (
        <Box
          key={note.id}
          draggable
          onDragStart={(e) => handleNoteDragStart(e, note.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            pl: depth * 2 + (parentId ? 1.5 : 1),
            py: 0.5,
            px: 1,
            cursor: 'grab',
            bgcolor: activeNoteId === note.id ? 'action.selected' : 'transparent',
            '&:hover': { bgcolor: activeNoteId === note.id ? 'action.selected' : 'action.hover' },
            '&:hover .note-actions': { opacity: 1 },
            '&:active': { cursor: 'grabbing' },
          }}
          onClick={() => setActiveNote(note.id)}>
          <DescriptionOutlinedIcon
            sx={{ fontSize: 16, color: note.color || 'text.disabled', mr: 0.75, flexShrink: 0 }}
          />
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
      ))}

      {/* Root drop zone — only render at top level to allow moving notes out of folders */}
      {parentId === null && (
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverFolderId('__root__');
          }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={(e) => handleFolderDrop(e, null)}
          sx={{
            minHeight: 40,
            flex: 1,
            borderTop: dragOverFolderId === '__root__' ? '2px dashed' : '2px dashed transparent',
            borderColor: dragOverFolderId === '__root__' ? 'primary.main' : 'transparent',
            borderRadius: 0.5,
            mx: 1,
            mt: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.15s',
          }}>
          {dragOverFolderId === '__root__' && (
            <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem' }}>
              Drop here to move out of folder
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
