'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useRagStore } from '@/app/stores/useRagStore';
import { MessageBubble } from './MessageBubble';
import { colors } from '@/lib/theme';

export function ConversationPanel() {
  const { messages, isLoading, sendMessage, clearConversation } = useRagStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      sx={{ backgroundColor: colors.background?.default ?? '#f9f9f9' }}>
      {/* Header */}
      <Box
        px={2}
        py={1.5}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          borderBottom: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
          backgroundColor: colors.background?.paper ?? '#fff',
          flexShrink: 0,
        }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            Collection Chat
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ask questions about the interview archive
          </Typography>
        </Box>
        {messages.length > 0 && (
          <Tooltip title="Clear conversation">
            <IconButton size="small" onClick={clearConversation} sx={{ color: 'text.disabled' }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Messages area */}
      <Box
        flex={1}
        overflow="auto"
        px={2}
        py={2}
        display="flex"
        flexDirection="column"
        data-rag-selectable="true">
        {messages.length === 0 && (
          <Box
            flex={1}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            gap={1}
            py={6}>
            <Typography variant="h6" fontWeight={600} color="text.secondary">
              Ask anything about the collection
            </Typography>
            <Typography variant="body2" color="text.disabled" maxWidth={320}>
              Ask about themes, people, events, or specific interviewees. Responses will include citations you can
              click to view the source recording.
            </Typography>
          </Box>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <Box display="flex" justifyContent="flex-start" mb={2}>
            <Box
              mr={1}
              flexShrink={0}
              width={28}
              height={28}
              borderRadius="50%"
              bgcolor={colors.secondary?.main ?? '#666'}
              display="flex"
              alignItems="center"
              justifyContent="center">
              <CircularProgress size={14} sx={{ color: '#fff' }} />
            </Box>
            <Box
              sx={{
                backgroundColor: colors.background?.paper ?? '#fff',
                border: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
                borderRadius: '18px 18px 18px 4px',
                px: 2,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: colors.grey?.[400] ?? '#bbb',
                    animation: 'ragDot 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                    '@keyframes ragDot': {
                      '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
                      '40%': { transform: 'scale(1.2)', opacity: 1 },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        px={2}
        py={1.5}
        sx={{
          borderTop: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
          backgroundColor: colors.background?.paper ?? '#fff',
          flexShrink: 0,
        }}>
        <Box display="flex" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder="Ask about the collection..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '14px',
                borderRadius: '12px',
              },
            }}
          />
          <IconButton
            type="submit"
            disabled={!input.trim() || isLoading}
            sx={{
              backgroundColor: colors.primary.main,
              color: colors.primary.contrastText,
              width: 40,
              height: 40,
              flexShrink: 0,
              '&:hover': { backgroundColor: colors.primary.dark ?? colors.primary.main, opacity: 0.85 },
              '&.Mui-disabled': { backgroundColor: colors.grey?.[200] ?? '#e0e0e0', color: colors.grey?.[400] ?? '#bbb' },
            }}>
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.disabled" display="block" mt={0.5} textAlign="center">
          Shift+Enter for new line · highlight any text to search the collection
        </Typography>
      </Box>
    </Box>
  );
}
