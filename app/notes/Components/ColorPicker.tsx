'use client';

import React, { useState } from 'react';
import { Box, Popover, TextField, IconButton } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
];

interface ColorPickerProps {
  color: string | null;
  onChange: (color: string | null) => void;
  size?: number;
}

export const ColorPicker = ({ color, onChange, size = 20 }: ColorPickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [customHex, setCustomHex] = useState('');

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
        <CircleIcon sx={{ fontSize: size, color: color || '#d1d5db', stroke: '#9ca3af', strokeWidth: color ? 0 : 1 }} />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Box sx={{ p: 1.5, width: 200 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, mb: 1 }}>
            {PRESET_COLORS.map((c) => (
              <IconButton
                key={c}
                size="small"
                onClick={() => {
                  onChange(c);
                  setAnchorEl(null);
                }}
                sx={{
                  p: 0.5,
                  border: color === c ? '2px solid #333' : '2px solid transparent',
                  borderRadius: '50%',
                }}>
                <CircleIcon sx={{ fontSize: 22, color: c }} />
              </IconButton>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="#hex"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && /^#[0-9a-fA-F]{3,6}$/.test(customHex)) {
                  onChange(customHex);
                  setCustomHex('');
                  setAnchorEl(null);
                }
              }}
              sx={{ flex: 1, '& input': { fontSize: 12, py: 0.5, px: 1 } }}
            />
            <IconButton
              size="small"
              onClick={() => {
                onChange(null);
                setAnchorEl(null);
              }}
              title="Clear color"
              sx={{ fontSize: 12 }}>
              ✕
            </IconButton>
          </Box>
        </Box>
      </Popover>
    </>
  );
};
