'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
const mod = isMac ? '\u2318' : 'Ctrl';
const shift = isMac ? '\u21E7' : 'Shift';
const alt = isMac ? '\u2325' : 'Alt';

const sections = [
  {
    title: 'Text Formatting',
    shortcuts: [
      { keys: [mod, 'B'], label: 'Bold' },
      { keys: [mod, 'I'], label: 'Italic' },
      { keys: [mod, 'U'], label: 'Underline' },
      { keys: [mod, shift, 'S'], label: 'Strikethrough' },
    ],
  },
  {
    title: 'Headings',
    shortcuts: [
      { keys: [mod, alt, '1'], label: 'Heading 1' },
      { keys: [mod, alt, '2'], label: 'Heading 2' },
      { keys: [mod, alt, '3'], label: 'Heading 3' },
    ],
  },
  {
    title: 'Lists',
    shortcuts: [
      { keys: [mod, shift, '8'], label: 'Bullet list' },
      { keys: [mod, shift, '7'], label: 'Numbered list' },
      { keys: [mod, shift, '9'], label: 'Task list' },
    ],
  },
  {
    title: 'Blocks',
    shortcuts: [
      { keys: [mod, alt, 'C'], label: 'Code block' },
      { keys: [mod, shift, 'B'], label: 'Blockquote' },
      { keys: [mod, 'K'], label: 'Insert link' },
    ],
  },
  {
    title: 'Alignment',
    shortcuts: [
      { keys: [mod, shift, 'L'], label: 'Align left' },
      { keys: [mod, shift, 'E'], label: 'Align center' },
      { keys: [mod, shift, 'R'], label: 'Align right' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: [mod, 'Z'], label: 'Undo' },
      { keys: [mod, shift, 'Z'], label: 'Redo' },
      { keys: [mod, shift, 'O'], label: 'Open AI assistant' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
    ],
  },
];

const Kbd = ({ children }: { children: string }) => (
  <Box
    component="kbd"
    sx={{
      display: 'inline-block',
      px: 0.75,
      py: 0.25,
      fontSize: '0.75rem',
      fontFamily: 'inherit',
      fontWeight: 600,
      lineHeight: 1,
      color: 'text.primary',
      bgcolor: 'grey.100',
      border: '1px solid',
      borderColor: 'grey.300',
      borderRadius: '4px',
      boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
      minWidth: 22,
      textAlign: 'center',
    }}>
    {children}
  </Box>
);

export const KeyboardShortcutsDialog = ({ open, onClose }: KeyboardShortcutsDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          Keyboard Shortcuts
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        {sections.map((section) => (
          <Box key={section.title} sx={{ mb: 2.5 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em' }}>
              {section.title}
            </Typography>
            {section.shortcuts.map((shortcut) => (
              <Box
                key={shortcut.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  {shortcut.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                          +
                        </Typography>
                      )}
                      <Kbd>{key}</Kbd>
                    </React.Fragment>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};
