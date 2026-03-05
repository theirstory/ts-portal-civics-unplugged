'use client';

import { Box } from '@mui/material';
import { useRagStore } from '@/app/stores/useRagStore';
import { ConversationPanel } from './ConversationPanel';
import { SidePanel } from './SidePanel';
import { SelectionToolbar } from './SelectionToolbar';

export function RagChatLayout() {
  const sidePanelState = useRagStore((s) => s.sidePanelState);
  const hasSidePanel = sidePanelState !== null;

  return (
    <>
      <SelectionToolbar />
      <Box
        display="flex"
        height="calc(100dvh - 56px)"
        overflow="hidden"
        sx={{ position: 'relative' }}>
        {/* Left: Conversation */}
        <Box
          sx={{
            flex: hasSidePanel ? '0 0 45%' : '1 1 100%',
            minWidth: 0,
            height: '100%',
            overflow: 'hidden',
            transition: 'flex 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}>
          <ConversationPanel />
        </Box>

        {/* Right: Side Panel */}
        {hasSidePanel && (
          <Box
            sx={{
              flex: '0 0 55%',
              minWidth: 0,
              height: '100%',
              overflow: 'hidden',
              animation: 'slideInRight 0.25s ease-out',
              '@keyframes slideInRight': {
                from: { transform: 'translateX(30px)', opacity: 0 },
                to: { transform: 'translateX(0)', opacity: 1 },
              },
            }}>
            <SidePanel />
          </Box>
        )}
      </Box>
    </>
  );
}
