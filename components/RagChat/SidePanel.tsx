'use client';

import { Box, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRagStore } from '@/app/stores/useRagStore';
import { RecordingView } from './RecordingView';
import { SearchResultsView } from './SearchResultsView';
import { colors } from '@/lib/theme';

export function SidePanel() {
  const { sidePanelState, closeSidePanel, searchAndShowInPanel } = useRagStore();

  if (!sidePanelState) return null;

  const handleBack = () => {
    // If we're in a recording that was opened from search results, go back to search
    // For simplicity, close the panel on back — the user can re-search
    closeSidePanel();
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background?.default ?? '#f9f9f9',
        borderLeft: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
        overflow: 'hidden',
        position: 'relative',
      }}>
      {/* Close button row */}
      <Box
        display="flex"
        justifyContent="flex-end"
        px={0.5}
        py={0.5}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 10,
        }}>
        <Tooltip title="Close panel">
          <IconButton size="small" onClick={closeSidePanel} sx={{ color: 'text.disabled' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {sidePanelState.type === 'recording' && (
        <RecordingView
          storyUuid={sidePanelState.storyUuid}
          startTime={sidePanelState.startTime}
          endTime={sidePanelState.endTime}
          storyTitle={sidePanelState.storyTitle}
        />
      )}

      {sidePanelState.type === 'search' && (
        <SearchResultsView
          query={sidePanelState.query}
          results={sidePanelState.results}
          isLoading={sidePanelState.isLoading}
        />
      )}
    </Box>
  );
}
