'use client';

import React, { memo, useState } from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessageContent } from './ChatMessageContent';
import { useChatContext } from '@/app/discover/ChatContext';
import { useNotesStore } from '@/app/stores/useNotesStore';
import { chatResponseToTipTapNodes } from '@/app/notes/utils/chatToNote';
import { colors } from '@/lib/theme';

type Props = {
  message: ChatMessageType;
};

export const ChatMessage = memo(({ message, userQuery }: Props & { userQuery?: string }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [savedAsNote, setSavedAsNote] = useState(false);
  const { onViewSources } = useChatContext();
  const createNoteWithContent = useNotesStore((s) => s.createNoteWithContent);
  const hasSources = !isUser && message.citations && message.citations.length > 0;

  const formatTimeChicago = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    let text = message.content;

    if (message.citations?.length) {
      const citationIndices = Array.from(
        new Set(Array.from(text.matchAll(/\[(\d+)\]/g)).map((m) => parseInt(m[1], 10))),
      ).sort((a, b) => a - b);

      if (citationIndices.length > 0) {
        const footnotes = citationIndices
          .map((idx) => {
            const c = message.citations!.find((c) => c.index === idx);
            if (!c) return null;
            return `${idx}. ${c.speaker}, "${c.interviewTitle}," ${c.sectionTitle}, ${formatTimeChicago(c.startTime)}–${formatTimeChicago(c.endTime)}.`;
          })
          .filter(Boolean)
          .join('\n');

        if (footnotes) {
          text = `${text}\n\n---\nSources:\n${footnotes}`;
        }
      }
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsNote = async () => {
    if (!message.content || savedAsNote) return;
    const title = userQuery || message.content.slice(0, 60).replace(/\n/g, ' ').trim() || 'Untitled';
    const nodes = chatResponseToTipTapNodes(message.content, message.citations || []);
    const note = await createNoteWithContent(title, nodes);
    if (note) {
      setSavedAsNote(true);
      setTimeout(() => setSavedAsNote(false), 3000);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
      <Box
        sx={{
          maxWidth: '85%',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isUser ? colors.primary.main : colors.background.paper,
          color: isUser ? colors.primary.contrastText : colors.text.primary,
          boxShadow: isUser ? 'none' : `0 1px 3px ${colors.common.shadow}`,
          '& p': { m: 0 },
          '& p + p': { mt: 1 },
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}>
        {isUser ? (
          message.content
        ) : (
          <ChatMessageContent content={message.content} citations={message.citations} messageId={message.id} />
        )}
      </Box>
      {!isUser && message.content && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Tooltip title={copied ? 'Copied!' : 'Copy response'} arrow>
            <IconButton size="small" onClick={handleCopy} sx={{ color: colors.text.secondary }}>
              {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={savedAsNote ? 'Saved to Notes!' : 'Save as Note'} arrow>
            <IconButton
              size="small"
              onClick={handleSaveAsNote}
              sx={{ color: savedAsNote ? colors.success.main : colors.text.secondary }}>
              {savedAsNote ? <CheckIcon sx={{ fontSize: 16 }} /> : <NoteAddIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          {hasSources && onViewSources && (
            <Button
              size="small"
              startIcon={<FormatListBulletedIcon sx={{ fontSize: 14 }} />}
              onClick={() => onViewSources(message.citations!)}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                color: colors.text.secondary,
                py: 0.25,
                px: 1,
                minHeight: 0,
                '&:hover': { bgcolor: colors.grey[100] },
              }}>
              View {message.citations!.length} source{message.citations!.length !== 1 ? 's' : ''}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
});

ChatMessage.displayName = 'ChatMessage';
