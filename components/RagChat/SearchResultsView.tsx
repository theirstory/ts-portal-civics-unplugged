'use client';

import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { colors } from '@/lib/theme';
import { formatTime } from '@/app/utils/util';
import { useRagStore } from '@/app/stores/useRagStore';
import type { RagSearchResult } from '@/types/rag';

type Props = {
  query: string;
  results: RagSearchResult[];
  isLoading: boolean;
};

function ResultCard({ result, onClick }: { result: RagSearchResult; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        p: 1.5,
        borderRadius: '8px',
        border: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
        backgroundColor: colors.background?.paper ?? '#fff',
        mb: 1,
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: colors.primary.main,
          backgroundColor: `${colors.primary.main}08`,
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      }}>
      <Box display="flex" alignItems="flex-start" gap={1}>
        <PlayCircleOutlineIcon sx={{ fontSize: 20, color: colors.primary.main, flexShrink: 0, mt: 0.25 }} />
        <Box flex={1} minWidth={0}>
          <Typography fontSize="13px" fontWeight={700} noWrap title={result.storyTitle}>
            {result.storyTitle}
          </Typography>
          <Typography fontSize="11px" color="text.secondary" mb={0.5}>
            {result.speaker} {result.sectionTitle ? `· ${result.sectionTitle}` : ''} · {formatTime(result.startTime)}
          </Typography>
          {result.excerpt && (
            <Typography
              fontSize="12px"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5,
              }}>
              "{result.excerpt}"
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export function SearchResultsView({ query, results, isLoading }: Props) {
  const { setSidePanelToRecording } = useRagStore();

  const handleResultClick = (result: RagSearchResult) => {
    setSidePanelToRecording({
      storyUuid: result.storyUuid,
      startTime: result.startTime,
      endTime: result.endTime,
      storyTitle: result.storyTitle,
    });
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" overflow="hidden">
      {/* Header */}
      <Box
        px={2}
        py={1.25}
        sx={{
          borderBottom: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
          backgroundColor: colors.background?.paper ?? '#fff',
          flexShrink: 0,
        }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SearchIcon sx={{ fontSize: 18, color: colors.primary.main }} />
          <Box>
            <Typography fontSize="13px" fontWeight={700}>
              Search results
            </Typography>
            <Typography
              fontSize="11px"
              color="text.secondary"
              noWrap
              title={query}
              sx={{ maxWidth: 240 }}>
              "{query}"
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Results */}
      <Box flex={1} overflow="auto" px={1.5} py={1.5} data-rag-selectable="true">
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} sx={{ color: colors.primary.main }} />
          </Box>
        )}

        {!isLoading && results.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography fontSize="14px" color="text.secondary">
              No results found for "{query}"
            </Typography>
          </Box>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <Typography fontSize="11px" color="text.disabled" mb={1}>
              {results.length} result{results.length !== 1 ? 's' : ''} · click to open recording
            </Typography>
            {results.map((result, i) => (
              <ResultCard key={`${result.storyUuid}-${result.startTime}-${i}`} result={result} onClick={() => handleResultClick(result)} />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
