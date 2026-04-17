'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Button, Paper, CircularProgress, Typography, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Citation } from '@/types/chat';
import { formatTime } from '@/app/utils/util';
import type { Editor } from '@tiptap/react';

type SearchType = 'bm25' | 'vector' | 'hybrid';

const SEARCH_BUTTONS: { type: SearchType; label: string }[] = [
  { type: 'bm25', label: 'Keyword' },
  { type: 'vector', label: 'Thematic' },
  { type: 'hybrid', label: 'Hybrid' },
];

interface NoteTextSelectionPopoverProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  editor: Editor | null;
}

export const NoteTextSelectionPopover = ({ containerRef, editor }: NoteTextSelectionPopoverProps) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [activeSearchType, setActiveSearchType] = useState<SearchType | null>(null);
  const [results, setResults] = useState<Citation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (text.length < 3) {
        if (!showResults) {
          setPosition(null);
          setSelectedText('');
        }
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
    }, 10);
  }, [containerRef, showResults]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (popoverRef.current?.contains(e.target as Node)) return;
    setPosition(null);
    setSelectedText('');
    setShowResults(false);
    setResults([]);
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
      setResults(data.citations || []);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setActiveSearchType(null);
    }
  };

  const handleInsert = (citation: Citation) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'transcriptEmbed',
        attrs: {
          theirstoryId: citation.theirstoryId,
          interviewTitle: citation.interviewTitle,
          speaker: citation.speaker,
          sectionTitle: citation.sectionTitle,
          startTime: citation.startTime,
          endTime: citation.endTime,
          transcription: citation.transcription,
          videoUrl: citation.videoUrl,
          isAudioFile: citation.isAudioFile || false,
        },
      })
      .run();
  };

  const handleClose = () => {
    setPosition(null);
    setSelectedText('');
    setShowResults(false);
    setResults([]);
    window.getSelection()?.removeAllRanges();
  };

  if (!position || !selectedText) return null;

  return (
    <Box
      ref={popoverRef}
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 1300,
      }}>
      {/* Search buttons */}
      <Paper elevation={4} sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
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
              borderRight: type !== 'hybrid' ? '1px solid' : 'none',
              borderColor: 'divider',
            }}>
            {label}
          </Button>
        ))}
      </Paper>

      {/* Results dropdown */}
      {showResults && (
        <Paper
          elevation={6}
          sx={{
            mt: 0.5,
            width: 380,
            maxHeight: 320,
            overflow: 'auto',
            borderRadius: 1,
            transform: 'translateX(-25%)',
          }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 0.75,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
            <Typography variant="caption" fontWeight={600}>
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{selectedText.slice(0, 30)}
              {selectedText.length > 30 ? '...' : ''}&rdquo;
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          {results.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No results found
            </Typography>
          )}
          {results.map((citation, i) => (
            <Box
              key={i}
              sx={{
                px: 1.5,
                py: 1,
                cursor: 'pointer',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
                '&:last-child': { borderBottom: 'none' },
              }}
              onClick={() => handleInsert(citation)}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" fontWeight={600}>
                    {citation.speaker}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                    {formatTime(citation.startTime)} - {formatTime(citation.endTime)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsert(citation);
                  }}>
                  <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }} noWrap>
                &ldquo;{citation.transcription}&rdquo;
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                {citation.interviewTitle}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};
