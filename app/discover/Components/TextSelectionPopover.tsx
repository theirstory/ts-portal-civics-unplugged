'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Paper, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { useChatStore } from '@/app/stores/useChatStore';
import { useChatContext } from '@/app/discover/ChatContext';
import { useNotesStore } from '@/app/stores/useNotesStore';
import { Citation } from '@/types/chat';
import { AddToNoteMenu } from '@/app/notes/Components/AddToNoteMenu';

type SearchType = 'bm25' | 'vector' | 'hybrid';

type Props = {
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const SEARCH_BUTTONS: { type: SearchType; label: string }[] = [
  { type: 'bm25', label: 'Keyword' },
  { type: 'vector', label: 'Thematic' },
  { type: 'hybrid', label: 'Hybrid' },
];

export const TextSelectionPopover = ({ containerRef }: Props) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [activeSearchType, setActiveSearchType] = useState<SearchType | null>(null);
  const [noteMenuAnchor, setNoteMenuAnchor] = useState<HTMLElement | null>(null);
  const setSearchResults = useChatStore((s) => s.setSearchResults);
  const appendToNote = useNotesStore((s) => s.appendToNote);
  const createNoteWithContent = useNotesStore((s) => s.createNoteWithContent);
  const { onSearchResults } = useChatContext();
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedTextRef = useRef('');

  const handleMouseUp = useCallback(() => {
    // Small delay to let browser finalize selection
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (text.length < 3) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const range = selection?.getRangeAt(0);
      if (!range) return;

      const rect = range.getBoundingClientRect();
      const container = containerRef.current;
      const containerRect = container?.getBoundingClientRect();
      if (!containerRect || !container) return;

      setPosition({
        top: rect.top - containerRect.top + container.scrollTop - 40,
        left: rect.left - containerRect.left + container.scrollLeft + rect.width / 2,
      });
      setSelectedText(text);
      selectedTextRef.current = text;
    }, 10);
  }, [containerRef]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Don't close if clicking inside the popover
    if (popoverRef.current?.contains(e.target as Node)) return;
    setPosition(null);
    setSelectedText('');
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [containerRef, handleMouseUp, handleMouseDown]);

  const handleSearch = async (searchType: SearchType) => {
    if (!selectedText || activeSearchType) return;
    setActiveSearchType(searchType);

    try {
      const response = await fetch('/api/discover/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: selectedText, searchType }),
      });

      if (!response.ok) throw new Error('Search failed');
      const data = (await response.json()) as { citations: Citation[] };
      if (onSearchResults) {
        onSearchResults(data.citations, selectedText, searchType);
      } else {
        setSearchResults(data.citations, selectedText, searchType);
      }
    } catch (error) {
      console.error('Selection search error:', error);
    } finally {
      setActiveSearchType(null);
      setPosition(null);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const makeBlockquoteNode = (text: string) => ({
    type: 'blockquote',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });

  const handleAddToExistingNote = async (noteId: string) => {
    await appendToNote(noteId, [makeBlockquoteNode(selectedTextRef.current)]);
    setPosition(null);
    setSelectedText('');
    setNoteMenuAnchor(null);
  };

  const handleAddToNewNote = async () => {
    const title = selectedTextRef.current.slice(0, 60).trim();
    await createNoteWithContent(title, [makeBlockquoteNode(selectedTextRef.current)]);
    setPosition(null);
    setSelectedText('');
    setNoteMenuAnchor(null);
  };

  if (!position || !selectedText) return null;

  return (
    <Paper
      ref={popoverRef}
      elevation={4}
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 1300,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
      }}>
      {SEARCH_BUTTONS.map(({ type, label }) => (
        <Button
          key={type}
          size="small"
          startIcon={activeSearchType === type ? <CircularProgress size={14} /> : <SearchIcon fontSize="small" />}
          onClick={() => handleSearch(type)}
          disabled={activeSearchType !== null}
          sx={{
            textTransform: 'none',
            px: 1.5,
            py: 0.75,
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            borderRadius: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
          }}>
          {label}
        </Button>
      ))}
      <Button
        size="small"
        startIcon={<NoteAddIcon fontSize="small" />}
        onClick={(e) => setNoteMenuAnchor(e.currentTarget)}
        disabled={activeSearchType !== null}
        sx={{
          textTransform: 'none',
          px: 1.5,
          py: 0.75,
          fontSize: '0.8rem',
          whiteSpace: 'nowrap',
          borderRadius: 0,
        }}>
        Note
      </Button>
      <AddToNoteMenu
        anchorEl={noteMenuAnchor}
        onClose={() => setNoteMenuAnchor(null)}
        onSelectNote={handleAddToExistingNote}
        onCreateNew={handleAddToNewNote}
      />
    </Paper>
  );
};
