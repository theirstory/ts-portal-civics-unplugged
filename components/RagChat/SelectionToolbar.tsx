'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useRagStore } from '@/app/stores/useRagStore';
import { colors } from '@/lib/theme';

// Add data-rag-selectable="true" to any container where text selection should trigger this toolbar

type ToolbarPosition = { top: number; left: number };

export function SelectionToolbar() {
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { searchAndShowInPanel } = useRagStore();

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        // Don't clear immediately – let click handler run first
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) return;

      // Check if the selection is within a data-rag-selectable container
      const range = selection.getRangeAt(0);
      let node: Node | null = range.commonAncestorContainer;
      let isInSelectableContainer = false;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.ragSelectable === 'true') {
          isInSelectableContainer = true;
          break;
        }
        node = node.parentNode;
      }

      if (!isInSelectableContainer) {
        setPosition(null);
        return;
      }

      // Position toolbar above the selection
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setPosition({
        top: rect.top + window.scrollY - 44,
        left: rect.left + rect.width / 2,
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (toolbarRef.current?.contains(e.target as Node)) return;
      setPosition(null);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const handleSearch = () => {
    if (!selectedText.trim()) return;
    window.getSelection()?.removeAllRanges();
    setPosition(null);
    searchAndShowInPanel(selectedText.trim());
  };

  if (!position) return null;

  return (
    <Box
      ref={toolbarRef}
      sx={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        backgroundColor: colors.primary.main,
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        // Arrow pointing down
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid ${colors.primary.main}`,
        },
      }}>
      <Button
        size="small"
        onClick={handleSearch}
        startIcon={<SearchIcon sx={{ fontSize: '14px !important' }} />}
        sx={{
          color: colors.primary.contrastText,
          textTransform: 'none',
          fontSize: '12px',
          fontWeight: 600,
          px: 1.5,
          py: 0.75,
          minHeight: 0,
          borderRadius: 0,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.15)',
          },
        }}>
        Search collection
      </Button>
    </Box>
  );
}
