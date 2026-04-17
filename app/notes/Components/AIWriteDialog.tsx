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
import EditNoteIcon from '@mui/icons-material/EditNote';
import type { Editor } from '@tiptap/react';

interface AIWriteDialogProps {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
}

/** Convert basic markdown to TipTap-compatible HTML for insertion */
function markdownToInsertHtml(md: string): string {
  return (
    md
      // Code blocks (fenced)
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        (_, lang, code) =>
          `<pre><code class="language-${lang}">${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trimEnd()}</code></pre>`,
      )
      // Headings
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
      // Unordered lists
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Paragraphs (lines not already wrapped)
      .replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>')
      // Clean up empty lines
      .replace(/\n{2,}/g, '\n')
  );
}

export const AIWriteDialog = ({ open, onClose, editor }: AIWriteDialogProps) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [done, setDone] = useState(false);
  const responseRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setPrompt('');
      setLoading(false);
      setResponse('');
      setDone(false);
      responseRef.current = '';
    } else {
      abortRef.current?.abort();
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResponse('');
    setDone(false);
    responseRef.current = '';

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Get existing note content as context
      const context = editor?.getText().slice(0, 2000) || undefined;

      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), context }),
        signal: controller.signal,
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
            const chunk = JSON.parse(raw);
            switch (chunk.type) {
              case 'text':
                responseRef.current += chunk.content;
                setResponse(responseRef.current);
                break;
              case 'done':
                setDone(true);
                setLoading(false);
                break;
              case 'error':
                setLoading(false);
                break;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setLoading(false);
      }
    }
  };

  const handleInsert = () => {
    if (!editor || !responseRef.current) return;
    const html = markdownToInsertHtml(responseRef.current);
    editor.chain().focus().insertContent(html).run();
    onClose();
  };

  const handleReplace = () => {
    if (!editor || !responseRef.current) return;
    const html = markdownToInsertHtml(responseRef.current);
    editor.chain().focus().selectAll().deleteSelection().insertContent(html).run();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditNoteIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Write with AI
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Prompt input */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="e.g. Write an introduction about youth civic engagement"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
            fullWidth
            multiline
            maxRows={4}
            autoFocus
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <EditNoteIcon />}
            sx={{ whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
            Generate
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          AI will use your existing note content as context to generate relevant text.
        </Typography>

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Response preview */}
        {response && (
          <Box
            sx={{
              maxHeight: 400,
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

        {/* Insert buttons */}
        {done && response && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleInsert} sx={{ textTransform: 'none' }}>
              Insert at cursor
            </Button>
            <Button variant="outlined" onClick={handleReplace} sx={{ textTransform: 'none' }}>
              Replace note content
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setResponse('');
                setDone(false);
                responseRef.current = '';
              }}
              sx={{ textTransform: 'none', ml: 'auto' }}>
              Discard
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
