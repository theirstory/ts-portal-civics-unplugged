'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TiptapLink from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TranscriptEmbedNode } from '../../extensions/TranscriptEmbedNode';
import { VideoEmbedNode } from '../../extensions/VideoEmbedNode';
import { NoteLinkNode } from '../../extensions/NoteLinkNode';
import { ResizableImageNode } from '../../extensions/ResizableImageNode';
import { Note } from '@/types/note';
import { organizationConfig } from '@/config/organizationConfig';

export default function PublicNotePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      TiptapLink.configure({
        openOnClick: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      ResizableImageNode,
      TranscriptEmbedNode,
      VideoEmbedNode,
      NoteLinkNode,
    ],
  });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/notes/public/${slug}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'Note not found' : 'Failed to load note');
          return;
        }
        const data = await res.json();
        setNote(data.note);

        // Set page title
        if (data.note?.title) {
          document.title = `${data.note.title} — ${organizationConfig.displayName || organizationConfig.name}`;
        }
      } catch {
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!editor || !note) return;
    if (note.content && Object.keys(note.content).length > 0) {
      editor.commands.setContent(note.content);
    }
  }, [editor, note]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !note) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Typography variant="h6" color="text.secondary">
          {error || 'Note not found'}
        </Typography>
      </Box>
    );
  }

  const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: { xs: 3, md: 6 } }}>
      <Box
        sx={{
          maxWidth: 720,
          mx: 'auto',
          px: { xs: 2.5, md: 0 },
        }}>
        {/* Hero */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              mb: 1.5,
            }}>
            {note.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {formattedDate}
          </Typography>
          <Divider sx={{ borderColor: 'primary.main', borderWidth: 1.5, width: 48 }} />
        </Box>

        {/* Content */}
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
            px: { xs: 3, md: 5 },
            py: { xs: 3, md: 4 },
            '& .tiptap': {
              outline: 'none',
              fontSize: '1.0625rem',
              lineHeight: 1.8,
              color: '#333',
              '& h1': {
                fontSize: '1.875rem',
                fontWeight: 700,
                mt: 4,
                mb: 1.5,
                letterSpacing: '-0.01em',
                color: 'text.primary',
              },
              '& h2': {
                fontSize: '1.5rem',
                fontWeight: 600,
                mt: 3,
                mb: 1,
                color: 'text.primary',
              },
              '& h3': {
                fontSize: '1.25rem',
                fontWeight: 600,
                mt: 2.5,
                mb: 0.75,
                color: 'text.primary',
              },
              '& p': { mb: 1.5 },
              '& ul, & ol': { pl: 3, mb: 1.5 },
              '& li': { mb: 0.5 },
              '& blockquote': {
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                pl: 2.5,
                ml: 0,
                my: 2,
                fontStyle: 'italic',
                color: 'text.secondary',
                '& p': { mb: 0.5 },
              },
              '& pre': {
                bgcolor: '#f5f5f5',
                borderRadius: 1.5,
                p: 2,
                overflow: 'auto',
                my: 2,
                '& code': { fontFamily: 'monospace', fontSize: '0.875rem' },
              },
              '& code': {
                bgcolor: '#f5f5f5',
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
              '& a': { color: 'primary.main', textDecoration: 'underline' },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1.5,
                my: 2,
                display: 'block',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              },
              '& hr': {
                border: 'none',
                borderTop: '1px solid',
                borderColor: 'divider',
                my: 3,
              },
              '& ul[data-type="taskList"]': {
                listStyle: 'none',
                pl: 0,
                '& li': {
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  '& label': { mt: 0.25 },
                },
              },
            },
          }}>
          <EditorContent editor={editor} />
        </Box>

        {/* Footer branding */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            mt: 5,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}>
          {organizationConfig.logo?.path && (
            <Box
              component="img"
              src={organizationConfig.logo.path}
              alt={organizationConfig.logo.alt || ''}
              sx={{ height: 24, opacity: 0.6 }}
            />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.6 }}>
            {organizationConfig.displayName || organizationConfig.name}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
