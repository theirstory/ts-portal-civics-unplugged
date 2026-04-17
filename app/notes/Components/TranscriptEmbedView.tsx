'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Box, Typography, IconButton, Tooltip, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { formatTime } from '@/app/utils/util';

export const TranscriptEmbedView = ({
  node,
  deleteNode,
}: {
  node: { attrs: Record<string, unknown> };
  deleteNode: () => void;
}) => {
  const attrs = node.attrs;
  const speaker = attrs.speaker as string;
  const interviewTitle = attrs.interviewTitle as string;
  const transcription = attrs.transcription as string;
  const startTime = attrs.startTime as number;
  const endTime = attrs.endTime as number;
  const theirstoryId = attrs.theirstoryId as string;

  const timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;
  const storyUrl = `/story/${theirstoryId}?t=${Math.floor(startTime)}`;

  return (
    <NodeViewWrapper>
      <Paper
        variant="outlined"
        contentEditable={false}
        sx={{
          my: 1,
          borderLeft: '3px solid',
          borderLeftColor: 'primary.main',
          borderRadius: 1,
          overflow: 'hidden',
          '&:hover .embed-actions': { opacity: 1 },
        }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
          <RecordVoiceOverIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} noWrap>
              {speaker}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
              {timeRange}
            </Typography>
          </Box>
          <Box className="embed-actions" sx={{ opacity: 0, display: 'flex', gap: 0.25 }}>
            <Tooltip title="Play recording">
              <IconButton size="small" component="a" href={storyUrl} target="_blank" sx={{ p: 0.25 }}>
                <PlayArrowIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" onClick={deleteNode} sx={{ p: 0.25 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Transcription */}
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            &ldquo;{transcription}&rdquo;
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 1.5, pb: 0.75 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            {interviewTitle}
          </Typography>
        </Box>
      </Paper>
    </NodeViewWrapper>
  );
};
