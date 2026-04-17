'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  Typography,
  IconButton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { Citation } from '@/types/chat';
import { formatTime } from '@/app/utils/util';
import type { Editor } from '@tiptap/react';

interface TranscriptSearchDialogProps {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
}

type SearchType = 'bm25' | 'vector' | 'hybrid';

export const TranscriptSearchDialog = ({ open, onClose, editor }: TranscriptSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('hybrid');
  const [results, setResults] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/discover/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, searchType }),
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.citations || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertTranscript = (citation: Citation) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'transcriptEmbed',
        attrs: {
          theirstoryId: citation.theirstoryId,
          interviewTitle: citation.interviewTitle,
          speaker: citation.speaker,
          sectionTitle: citation.sectionTitle,
          startTime: citation.startTime,
          endTime: citation.endTime,
          transcription: citation.transcription,
          videoUrl: citation.videoUrl,
          isAudioFile: citation.isAudioFile || false,
        },
      })
      .run();
    onClose();
  };

  const handleInsertVideo = (citation: Citation) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'videoEmbed',
        attrs: {
          theirstoryId: citation.theirstoryId,
          interviewTitle: citation.interviewTitle,
          videoUrl: citation.videoUrl,
          isAudioFile: citation.isAudioFile || false,
          startTime: citation.startTime,
        },
      })
      .run();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          Embed from Archive
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Search controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search the archive..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            fullWidth
            autoFocus
          />
          <ToggleButtonGroup size="small" value={searchType} exclusive onChange={(_, v) => v && setSearchType(v)}>
            <ToggleButton value="bm25" sx={{ textTransform: 'none', px: 1.5 }}>
              Keyword
            </ToggleButton>
            <ToggleButton value="vector" sx={{ textTransform: 'none', px: 1.5 }}>
              Thematic
            </ToggleButton>
            <ToggleButton value="hybrid" sx={{ textTransform: 'none', px: 1.5 }}>
              Hybrid
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
            sx={{ whiteSpace: 'nowrap' }}>
            Search
          </Button>
        </Box>

        {/* Results */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {results.length === 0 && !loading && query && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No results found
            </Typography>
          )}
          {results.map((citation, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                p: 1.5,
                mb: 1,
                borderLeft: '3px solid',
                borderLeftColor: 'primary.main',
                '&:hover': { bgcolor: 'action.hover' },
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Box>
                  <Typography variant="caption" fontWeight={600}>
                    {citation.speaker}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                    {formatTime(citation.startTime)} - {formatTime(citation.endTime)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Embed transcript">
                    <IconButton size="small" onClick={() => handleInsertTranscript(citation)}>
                      <RecordVoiceOverIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={citation.isAudioFile ? 'Embed audio' : 'Embed video'}>
                    <IconButton size="small" onClick={() => handleInsertVideo(citation)}>
                      {citation.isAudioFile ? (
                        <AudiotrackIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <VideocamIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0.5 }}>
                &ldquo;{citation.transcription}&rdquo;
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {citation.interviewTitle}
              </Typography>
            </Paper>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
