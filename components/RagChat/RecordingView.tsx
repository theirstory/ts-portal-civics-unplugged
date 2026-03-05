'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link as MuiLink,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MuxPlayer from '@mux/mux-player-react';
import MuxPlayerElement from '@mux/mux-player';
import { colors } from '@/lib/theme';
import { getMuxPlaybackId } from '@/app/utils/converters';
import { formatTime } from '@/app/utils/util';
import { Transcription, Section, Paragraph } from '@/types/transcription';
import { Testimonies } from '@/types/weaviate';

type StoryData = {
  uuid: string;
  properties: Testimonies;
};

type Props = {
  storyUuid: string;
  startTime: number;
  endTime?: number;
  storyTitle: string;
};

function ParagraphBlock({
  paragraph,
  highlightRange,
  onWordClick,
}: {
  paragraph: Paragraph;
  highlightRange: { start: number; end: number } | null;
  onWordClick: (time: number) => void;
}) {
  const words = paragraph.words ?? [];
  const paragraphText = words.map((w) => w.text).join(' ');

  const isHighlighted =
    highlightRange !== null &&
    paragraph.end >= highlightRange.start &&
    paragraph.start <= highlightRange.end;

  return (
    <Box
      mb={1.5}
      data-para-start={paragraph.start}
      data-para-end={paragraph.end}
      sx={{
        borderRadius: '4px',
        backgroundColor: isHighlighted ? `${colors.warning?.main ?? '#ff9800'}22` : 'transparent',
        transition: 'background-color 0.3s',
        p: isHighlighted ? 0.75 : 0,
      }}>
      <Typography
        fontSize="11px"
        fontWeight={700}
        color="primary"
        gutterBottom
        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        onClick={() => onWordClick(paragraph.start)}>
        {formatTime(paragraph.start)} {paragraph.speaker}
      </Typography>
      <Typography
        component="p"
        fontSize="13px"
        lineHeight={1.7}
        sx={{ wordBreak: 'break-word', userSelect: 'text' }}
        data-rag-selectable="true">
        {words.length > 0
          ? words.map((word, i) => {
              const isWordHighlighted =
                highlightRange !== null &&
                word.start >= highlightRange.start - 0.1 &&
                word.end <= highlightRange.end + 0.1;
              return (
                <Box
                  key={i}
                  component="span"
                  onClick={() => onWordClick(word.start)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: isWordHighlighted ? `${colors.warning?.main ?? '#ff9800'}66` : 'transparent',
                    borderRadius: '2px',
                    '&:hover': { backgroundColor: `${colors.primary.main}22` },
                  }}>
                  {word.text}{' '}
                </Box>
              );
            })
          : paragraphText}
      </Typography>
    </Box>
  );
}

function SectionBlock({
  section,
  highlightRange,
  onWordClick,
  defaultExpanded,
}: {
  section: Section;
  highlightRange: { start: number; end: number } | null;
  onWordClick: (time: number) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded((v) => !v)}
      disableGutters
      elevation={0}
      sx={{
        '&:before': { display: 'none' },
        border: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
        borderRadius: '6px !important',
        mb: 1,
        overflow: 'hidden',
      }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
        sx={{
          backgroundColor: colors.primary.main,
          minHeight: '40px',
          '& .MuiAccordionSummary-content': { my: 0.5 },
        }}>
        <Box>
          <Typography fontSize="13px" fontWeight={700} color={colors.primary.contrastText}>
            {section.title || 'Section'}
          </Typography>
          {section.synopsis && !expanded && (
            <Typography fontSize="11px" color={colors.primary.contrastText} sx={{ opacity: 0.85 }}>
              {section.synopsis}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, py: 1 }}>
        {(section.paragraphs ?? []).map((para, i) => (
          <ParagraphBlock
            key={`${para.start}-${i}`}
            paragraph={para}
            highlightRange={highlightRange}
            onWordClick={onWordClick}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export function RecordingView({ storyUuid, startTime, endTime, storyTitle }: Props) {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<MuxPlayerElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const hasSeeded = useRef(false);

  useEffect(() => {
    hasSeeded.current = false;
    setLoading(true);
    setError(null);
    setStoryData(null);

    fetch(`/api/story/${storyUuid}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json() as Promise<StoryData>;
      })
      .then(setStoryData)
      .catch(() => setError('Could not load this recording.'))
      .finally(() => setLoading(false));
  }, [storyUuid]);

  // Seek to startTime after player loads
  const handlePlayerLoaded = () => {
    if (!hasSeeded.current && playerRef.current && startTime > 0) {
      hasSeeded.current = true;
      playerRef.current.currentTime = startTime;
    }
  };

  const seekToTime = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
      playerRef.current.play().catch(() => {});
    }
    // Scroll transcript to paragraph containing this time
    scrollTranscriptToTime(time);
  };

  const scrollTranscriptToTime = (time: number) => {
    if (!transcriptRef.current) return;
    const el = transcriptRef.current.querySelector(`[data-para-start]`) as HTMLElement | null;
    if (!el) return;

    // Find the paragraph element whose start <= time < end
    const allParas = transcriptRef.current.querySelectorAll('[data-para-start]');
    for (const para of allParas) {
      const start = parseFloat((para as HTMLElement).dataset.paraStart ?? '0');
      const end = parseFloat((para as HTMLElement).dataset.paraEnd ?? '0');
      if (time >= start && time < end) {
        (para as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  };

  if (loading) {
    return (
      <Box flex={1} display="flex" alignItems="center" justifyContent="center">
        <CircularProgress size={32} sx={{ color: colors.primary.main }} />
      </Box>
    );
  }

  if (error || !storyData) {
    return (
      <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={2}>
        <Typography color="error" fontSize="14px">
          {error ?? 'Recording not found.'}
        </Typography>
      </Box>
    );
  }

  const props = storyData.properties;
  const transcription: Transcription | null = (() => {
    try {
      return props.transcription ? (JSON.parse(props.transcription) as Transcription) : null;
    } catch {
      return null;
    }
  })();

  const highlightRange = endTime !== undefined ? { start: startTime, end: endTime } : null;
  const playbackId = getMuxPlaybackId(props.video_url);
  const isAudioFile = props.isAudioFile ?? false;

  // Determine which section contains the startTime so we can expand it by default
  const targetSectionStart = (() => {
    if (!transcription) return null;
    for (const section of transcription.sections ?? []) {
      const lastPara = section.paragraphs?.[section.paragraphs.length - 1];
      const sectionEnd = lastPara?.end ?? section.start;
      if (startTime >= section.start && startTime <= sectionEnd) {
        return section.start;
      }
    }
    return transcription.sections?.[0]?.start ?? null;
  })();

  return (
    <Box display="flex" flexDirection="column" height="100%" overflow="hidden">
      {/* Recording header */}
      <Box
        px={2}
        py={1.25}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{
          borderBottom: `1px solid ${colors.grey?.[200] ?? '#e0e0e0'}`,
          backgroundColor: colors.background?.paper ?? '#fff',
          flexShrink: 0,
        }}>
        <Box flex={1} minWidth={0}>
          <Typography fontSize="13px" fontWeight={700} noWrap title={props.interview_title}>
            {props.interview_title || storyTitle}
          </Typography>
          <Typography fontSize="11px" color="text.secondary">
            {props.participants?.[0]?.name ?? ''}{' '}
            {props.recording_date ? `· ${props.recording_date}` : ''}
          </Typography>
        </Box>
        <Tooltip title="Open full story page">
          <MuiLink
            href={`/story/${storyUuid}?start=${startTime}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ flexShrink: 0 }}>
            <IconButton size="small">
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </MuiLink>
        </Tooltip>
      </Box>

      {/* Player */}
      {playbackId && (
        <Box
          sx={{
            flexShrink: 0,
            height: isAudioFile ? 64 : 180,
            backgroundColor: '#000',
          }}>
          <MuxPlayer
            ref={playerRef}
            src={props.video_url}
            audio={isAudioFile}
            startTime={startTime}
            onLoadedMetadata={handlePlayerLoaded}
            accentColor={colors.secondary?.main ?? colors.primary.main}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      )}

      {/* Transcript */}
      <Box ref={transcriptRef} flex={1} overflow="auto" px={1.5} py={1.5}>
        {transcription ? (
          (transcription.sections ?? []).map((section, si) => (
            <SectionBlock
              key={`${section.start}-${si}`}
              section={section}
              highlightRange={highlightRange}
              onWordClick={seekToTime}
              defaultExpanded={section.start === targetSectionStart}
            />
          ))
        ) : (
          <Typography fontSize="13px" color="text.secondary">
            No transcript available.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
