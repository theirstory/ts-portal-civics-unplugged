'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Box, TextField, Typography, IconButton, Tooltip } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import TiptapLink from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { NoteEditorToolbar } from './NoteEditorToolbar';
import { ColorPicker } from './ColorPicker';
import { useNotesStore } from '@/app/stores/useNotesStore';
import TurndownService from 'turndown';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

/** Lightweight markdown → HTML for round-tripping back into TipTap */
function markdownToHtml(md: string): string {
  return (
    md
      // Code blocks (fenced)
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        (_, lang, code) => `<pre><code class="language-${lang}">${escapeHtml(code.trimEnd())}</code></pre>`,
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
      // Task lists
      .replace(/<li>\[x\] (.+)<\/li>/g, '<li data-type="taskItem" data-checked="true">$1</li>')
      .replace(/<li>\[ \] (.+)<\/li>/g, '<li data-type="taskItem" data-checked="false">$1</li>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Paragraphs (lines not already wrapped)
      .replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>')
      // Clean up empty lines
      .replace(/\n{2,}/g, '\n')
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const NoteEditor = () => {
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const notes = useNotesStore((s) => s.notes);
  const updateNote = useNotesStore((s) => s.updateNote);
  const saving = useNotesStore((s) => s.saving);
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;
  const skipUpdateRef = useRef(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownDraft, setMarkdownDraft] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }).extend({
        addKeyboardShortcuts() {
          return {
            'Mod-k': () => {
              const { editor } = this;
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
                return true;
              }
              const url = window.prompt('Enter URL:');
              if (url) {
                editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
              }
              return true;
            },
          };
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    onUpdate: ({ editor }) => {
      if (!activeNoteId || skipUpdateRef.current) return;
      const json = editor.getJSON();
      const html = editor.getHTML();
      const markdown = turndown.turndown(html);
      updateNote(activeNoteId, {
        content: json as Record<string, unknown>,
        contentMarkdown: markdown,
      });
    },
  });

  // Load content when active note changes
  useEffect(() => {
    if (!editor || !activeNote) return;
    const currentContent = JSON.stringify(editor.getJSON());
    const noteContent = JSON.stringify(activeNote.content);
    if (currentContent !== noteContent && Object.keys(activeNote.content).length > 0) {
      skipUpdateRef.current = true;
      editor.commands.setContent(activeNote.content);
      skipUpdateRef.current = false;
    } else if (Object.keys(activeNote.content).length === 0) {
      skipUpdateRef.current = true;
      editor.commands.clearContent();
      skipUpdateRef.current = false;
    }
    // Only run when activeNoteId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNoteId]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeNoteId) return;
      updateNote(activeNoteId, { title: e.target.value });
    },
    [activeNoteId, updateNote],
  );

  const handleColorChange = useCallback(
    (color: string | null) => {
      if (!activeNoteId) return;
      updateNote(activeNoteId, { color });
    },
    [activeNoteId, updateNote],
  );

  if (!activeNote) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.secondary' }}>
        <Typography variant="body1">Select or create a note to get started</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 2, pb: 1 }}>
        <ColorPicker color={activeNote.color} onChange={handleColorChange} />
        <TextField
          variant="standard"
          value={activeNote.title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          fullWidth
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: '1.5rem', fontWeight: 700 },
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', ml: 1 }}>
          {saving ? 'Saving...' : 'Saved'}
        </Typography>
        <Tooltip title={showMarkdown ? 'Rich text editor' : 'Edit markdown'}>
          <IconButton
            size="small"
            onClick={() => {
              if (showMarkdown) {
                // Switching back to rich text — parse markdown into editor
                if (editor && markdownDraft !== activeNote.contentMarkdown) {
                  const html = markdownToHtml(markdownDraft);
                  skipUpdateRef.current = true;
                  editor.commands.setContent(html);
                  skipUpdateRef.current = false;
                  // Trigger save with new content
                  const json = editor.getJSON();
                  updateNote(activeNoteId!, {
                    content: json as Record<string, unknown>,
                    contentMarkdown: markdownDraft,
                  });
                }
                setShowMarkdown(false);
              } else {
                // Switching to markdown — snapshot current markdown
                setMarkdownDraft(activeNote.contentMarkdown || '');
                setShowMarkdown(true);
              }
            }}
            sx={{ ml: 0.5 }}>
            {showMarkdown ? <EditNoteIcon fontSize="small" /> : <CodeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {showMarkdown ? (
        /* Markdown editor */
        <Box
          component="textarea"
          value={markdownDraft}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMarkdownDraft(e.target.value)}
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 2,
            py: 1.5,
            m: 0,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            bgcolor: '#fafafa',
            borderTop: '1px solid',
            borderColor: 'divider',
            border: 'none',
            borderTopStyle: 'solid',
            borderTopWidth: '1px',
            outline: 'none',
            resize: 'none',
            width: '100%',
          }}
        />
      ) : (
        <>
          {/* Toolbar */}
          <NoteEditorToolbar editor={editor} />

          {/* Editor */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              px: 2,
              py: 1,
              '& .tiptap': {
                outline: 'none',
                minHeight: '300px',
                '& p.is-editor-empty:first-of-type::before': {
                  content: 'attr(data-placeholder)',
                  color: '#adb5bd',
                  pointerEvents: 'none',
                  float: 'left',
                  height: 0,
                },
                '& h1': { fontSize: '1.75rem', fontWeight: 700, mt: 2, mb: 1 },
                '& h2': { fontSize: '1.375rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
                '& h3': { fontSize: '1.125rem', fontWeight: 600, mt: 1, mb: 0.5 },
                '& ul, & ol': { pl: 3 },
                '& blockquote': {
                  borderLeft: '3px solid',
                  borderColor: 'divider',
                  pl: 2,
                  ml: 0,
                  fontStyle: 'italic',
                  color: 'text.secondary',
                },
                '& pre': {
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  p: 1.5,
                  overflow: 'auto',
                  '& code': { fontFamily: 'monospace', fontSize: '0.875rem' },
                },
                '& code': {
                  bgcolor: '#f5f5f5',
                  px: 0.5,
                  borderRadius: 0.5,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                },
                '& a': { color: 'primary.main', textDecoration: 'underline' },
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
        </>
      )}
    </Box>
  );
};
