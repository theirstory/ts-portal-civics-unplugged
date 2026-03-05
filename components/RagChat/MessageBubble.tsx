'use client';

import { Box, Typography, Chip, Paper } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { colors } from '@/lib/theme';
import { useRagStore, RagMessage, RagCitation } from '@/app/stores/useRagStore';
import { formatTime } from '@/app/utils/util';

type Props = {
  message: RagMessage;
};

// Parses assistant content replacing [N] with clickable citation elements
function ParsedContent({ content, citations, onCitationClick }: {
  content: string;
  citations?: RagCitation[];
  onCitationClick: (citation: RagCitation) => void;
}) {
  if (!citations?.length) {
    return (
      <Typography
        component="div"
        fontSize="14px"
        lineHeight={1.7}
        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        data-rag-selectable="true">
        {content}
      </Typography>
    );
  }

  // Split content on [N] patterns
  const parts = content.split(/(\[\d+\])/g);

  return (
    <Typography
      component="div"
      fontSize="14px"
      lineHeight={1.7}
      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      data-rag-selectable="true">
      {parts.map((part, i) => {
        const citationMatch = part.match(/^\[(\d+)\]$/);
        if (citationMatch) {
          const num = parseInt(citationMatch[1], 10);
          const citation = citations.find((c) => c.id === num);
          if (citation) {
            return (
              <Chip
                key={i}
                label={`[${num}]`}
                size="small"
                onClick={() => onCitationClick(citation)}
                sx={{
                  height: 18,
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: colors.primary.main,
                  color: colors.primary.contrastText,
                  verticalAlign: 'super',
                  mx: '1px',
                  '& .MuiChip-label': { px: '6px' },
                  '&:hover': { backgroundColor: colors.primary.dark ?? colors.primary.main, opacity: 0.85 },
                }}
              />
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </Typography>
  );
}

function CitationFooter({ citations, onCitationClick }: {
  citations: RagCitation[];
  onCitationClick: (citation: RagCitation) => void;
}) {
  // Only show citations that are referenced in the content
  if (!citations.length) return null;

  return (
    <Box mt={1.5} display="flex" flexDirection="column" gap={0.75}>
      {citations.map((c) => (
        <Box
          key={c.id}
          onClick={() => onCitationClick(c)}
          sx={{
            cursor: 'pointer',
            borderLeft: `3px solid ${colors.primary.main}`,
            pl: 1.5,
            py: 0.5,
            borderRadius: '0 4px 4px 0',
            backgroundColor: colors.grey?.[50] ?? '#fafafa',
            '&:hover': { backgroundColor: colors.grey?.[100] ?? '#f5f5f5' },
            transition: 'background-color 0.15s',
          }}>
          <Typography fontSize="11px" fontWeight={700} color="primary" gutterBottom={false}>
            [{c.id}] {c.storyTitle}
            {c.speaker ? ` · ${c.speaker}` : ''}
            {' · '}
            <Typography component="span" fontSize="11px" color="text.secondary">
              {formatTime(c.startTime)}
            </Typography>
          </Typography>
          {c.quote && (
            <Box display="flex" alignItems="flex-start" gap={0.5} mt={0.25}>
              <FormatQuoteIcon sx={{ fontSize: 12, color: 'text.disabled', mt: '2px', flexShrink: 0 }} />
              <Typography
                fontSize="12px"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.5,
                }}>
                {c.quote}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

export function MessageBubble({ message }: Props) {
  const { setSidePanelToRecording } = useRagStore();
  const isUser = message.role === 'user';

  const handleCitationClick = (citation: RagCitation) => {
    setSidePanelToRecording({
      storyUuid: citation.storyUuid,
      startTime: citation.startTime,
      endTime: citation.endTime,
      storyTitle: citation.storyTitle,
      highlightCitationId: citation.id,
    });
  };

  if (isUser) {
    return (
      <Box display="flex" justifyContent="flex-end" mb={1.5}>
        <Box maxWidth="80%">
          <Paper
            elevation={0}
            sx={{
              backgroundColor: colors.primary.main,
              color: colors.primary.contrastText,
              borderRadius: '18px 18px 4px 18px',
              px: 2,
              py: 1.25,
            }}>
            <Typography fontSize="14px" lineHeight={1.6} sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          </Paper>
        </Box>
        <Box
          ml={1}
          flexShrink={0}
          width={28}
          height={28}
          borderRadius="50%"
          bgcolor={colors.primary.main}
          display="flex"
          alignItems="center"
          justifyContent="center"
          alignSelf="flex-end">
          <PersonIcon sx={{ fontSize: 16, color: colors.primary.contrastText }} />
        </Box>
      </Box>
    );
  }

  return (
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
        justifyContent="center"
        alignSelf="flex-start"
        mt={0.5}>
        <SmartToyIcon sx={{ fontSize: 16, color: '#fff' }} />
      </Box>
      <Box maxWidth="calc(100% - 40px)">
        <Paper
          elevation={0}
          sx={{
            backgroundColor: colors.background?.paper ?? '#fff',
            borderRadius: '18px 18px 18px 4px',
            border: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
            px: 2,
            py: 1.5,
          }}>
          <ParsedContent
            content={message.content}
            citations={message.citations}
            onCitationClick={handleCitationClick}
          />
          {message.citations && message.citations.length > 0 && (
            <CitationFooter citations={message.citations} onCitationClick={handleCitationClick} />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
