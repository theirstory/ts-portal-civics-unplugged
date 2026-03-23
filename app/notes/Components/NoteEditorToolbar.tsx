'use client';

import React from 'react';
import { Box, IconButton, Divider, ToggleButton, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CodeIcon from '@mui/icons-material/Code';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import LinkIcon from '@mui/icons-material/Link';
import type { Editor } from '@tiptap/react';

interface NoteEditorToolbarProps {
  editor: Editor | null;
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
const mod = isMac ? '\u2318' : 'Ctrl+';
const shift = isMac ? '\u21E7' : 'Shift+';
const alt = isMac ? '\u2325' : 'Alt+';

export const NoteEditorToolbar = ({ editor }: NoteEditorToolbarProps) => {
  if (!editor) return null;

  const btnSx = { p: 0.5, borderRadius: 1, minWidth: 0, width: 32, height: 32 };

  const handleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 1,
        py: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
      }}>
      {/* Headings */}
      {([1, 2, 3] as const).map((level) => (
        <Tooltip key={level} title={`Heading ${level} (${mod}${alt}${level})`}>
          <ToggleButton
            value={`h${level}`}
            selected={editor.isActive('heading', { level })}
            onChange={() => editor.chain().focus().toggleHeading({ level }).run()}
            size="small"
            sx={{ ...btnSx, fontSize: 13 - level, fontWeight: 700 }}>
            H{level}
          </ToggleButton>
        </Tooltip>
      ))}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Inline formatting */}
      <Tooltip title={`Bold (${mod}B)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBold().run()}
          color={editor.isActive('bold') ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatBoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Italic (${mod}I)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          color={editor.isActive('italic') ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Underline (${mod}U)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          color={editor.isActive('underline') ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatUnderlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Strikethrough (${mod}${shift}S)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          color={editor.isActive('strike') ? 'primary' : 'default'}
          sx={btnSx}>
          <StrikethroughSIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Lists */}
      <Tooltip title={`Bullet list (${mod}${shift}8)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          color={editor.isActive('bulletList') ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Numbered list (${mod}${shift}7)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          color={editor.isActive('orderedList') ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatListNumberedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Task list (${mod}${shift}9)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          color={editor.isActive('taskList') ? 'primary' : 'default'}
          sx={btnSx}>
          <ChecklistIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Block formatting */}
      <Tooltip title={`Code block (${mod}${alt}C)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          color={editor.isActive('codeBlock') ? 'primary' : 'default'}
          sx={btnSx}>
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Blockquote (${mod}${shift}B)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          color={editor.isActive('blockquote') ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatQuoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Link (${mod}K)`}>
        <IconButton
          size="small"
          onClick={handleLink}
          color={editor.isActive('link') ? 'primary' : 'default'}
          sx={btnSx}>
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Alignment */}
      <Tooltip title={`Align left (${mod}${shift}L)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatAlignLeftIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Align center (${mod}${shift}E)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatAlignCenterIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Align right (${mod}${shift}R)`}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
          sx={btnSx}>
          <FormatAlignRightIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
