'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Box, Typography, IconButton, Tooltip, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MuxPlayer from '@mux/mux-player-react';
import { getMuxPlaybackId } from '@/app/utils/converters';

export const VideoEmbedView = ({
  node,
  deleteNode,
}: {
  node: { attrs: Record<string, unknown> };
  deleteNode: () => void;
}) => {
  const attrs = node.attrs;
  const interviewTitle = attrs.interviewTitle as string;
  const videoUrl = attrs.videoUrl as string;
  const isAudioFile = attrs.isAudioFile as boolean;
  const startTime = attrs.startTime as number;
  const theirstoryId = attrs.theirstoryId as string;

  const playbackId = getMuxPlaybackId(videoUrl);
  const storyUrl = `/story/${theirstoryId}${startTime ? `?t=${Math.floor(startTime)}` : ''}`;

  return (
    <NodeViewWrapper>
      <Paper
        variant="outlined"
        contentEditable={false}
        sx={{
          my: 1,
          borderRadius: 1,
          overflow: 'hidden',
          '&:hover .embed-actions': { opacity: 1 },
        }}>
        {/* Player */}
        {playbackId ? (
          <Box sx={{ position: 'relative', bgcolor: '#000' }}>
            <MuxPlayer
              playbackId={playbackId}
              startTime={startTime || 0}
              audio={isAudioFile}
              streamType="on-demand"
              style={{
                width: '100%',
                maxHeight: isAudioFile ? 48 : 360,
                aspectRatio: isAudioFile ? undefined : '16/9',
                display: 'block',
                '--controls-font-size': '12px',
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="body2" color="text.secondary">
              Video unavailable
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            py: 0.75,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}>
          <Typography variant="caption" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
            {interviewTitle}
          </Typography>
          <Box className="embed-actions" sx={{ opacity: 0, display: 'flex', gap: 0.25 }}>
            <Tooltip title="Open recording">
              <IconButton size="small" component="a" href={storyUrl} target="_blank" sx={{ p: 0.25 }}>
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" onClick={deleteNode} sx={{ p: 0.25 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </NodeViewWrapper>
  );
};
