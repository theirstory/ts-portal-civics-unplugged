'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { chatResponseToTipTapNodes } from '../utils/chatToNote';
import { Citation, ChatStreamChunk } from '@/types/chat';
import type { Editor } from '@tiptap/react';

interface AskArchiveDialogProps {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
}

export const AskArchiveDialog = ({ open, onClose, editor }: AskArchiveDialogProps) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [done, setDone] = useState(false);
  const responseRef = useRef('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setLoading(false);
      setStatus('');
      setResponse('');
      setCitations([]);
      setDone(false);
      responseRef.current = '';
    }
  }, [open]);

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setStatus('Searching the archive...');
    setResponse('');
    setCitations([]);
    setDone(false);
    responseRef.current = '';

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          query: query.trim(),
        }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') continue;

          try {
            const chunk = JSON.parse(raw) as ChatStreamChunk;
            switch (chunk.type) {
              case 'status':
                setStatus(chunk.status);
                break;
              case 'citations':
                setCitations(chunk.citations);
                break;
              case 'text':
                responseRef.current += chunk.content;
                setResponse(responseRef.current);
                break;
              case 'done':
                setDone(true);
                setLoading(false);
                setStatus('');
                break;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setStatus('');
      setLoading(false);
    }
  };

  const handleInsert = (includeVideo: boolean) => {
    if (!editor || !responseRef.current) return;

    const nodes = chatResponseToTipTapNodes(responseRef.current, citations, { includeVideo });

    // Insert at current cursor position
    editor.chain().focus().insertContent(nodes).run();

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Ask the Archive
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Query input */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="e.g. What experiences have youth had with AI?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            fullWidth
            autoFocus
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
            sx={{ whiteSpace: 'nowrap' }}>
            Ask
          </Button>
        </Box>

        {/* Status */}
        {loading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {status}
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Response preview */}
        {response && (
          <Box
            sx={{
              maxHeight: 350,
              overflow: 'auto',
              bgcolor: '#fafafa',
              borderRadius: 1,
              p: 2,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
            {response}
            {loading && <span style={{ opacity: 0.5 }}>|</span>}
          </Box>
        )}

        {/* Citation count */}
        {citations.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            {citations.length} source{citations.length !== 1 ? 's' : ''} found
          </Typography>
        )}

        {/* Insert buttons */}
        {done && response && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => handleInsert(false)} sx={{ textTransform: 'none' }}>
              Insert with transcript quotes
            </Button>
            <Button variant="outlined" onClick={() => handleInsert(true)} sx={{ textTransform: 'none' }}>
              Insert with quotes + video
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
