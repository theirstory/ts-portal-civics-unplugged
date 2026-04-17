'use client';

 
import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { organizationConfig, themeColors } from '@/config/organizationConfig';
import type { JSONContent } from '@tiptap/react';

interface SlidesPreviewProps {
  json: JSONContent;
  title: string;
  updatedAt: string;
  onExport: (options: SlideCustomization) => void;
  exporting: boolean;
}

export interface SlideCustomization {
  title: string;
  accentColor: string;
  theme: 'light' | 'dark' | 'brand';
  updatedAt: string;
  orgName: string;
  orgLogoPath?: string;
}

type SlideTheme = 'light' | 'dark' | 'brand';

interface ParsedSlide {
  type: 'title' | 'section' | 'content' | 'quote' | 'image';
  heading?: string;
  bullets: string[];
  quoteText?: string;
  quoteSpeaker?: string;
  imageSrc?: string;
}

function getPlainText(content?: any[]): string {
  if (!content) return '';
  return content.map((n) => (n.type === 'text' ? n.text || '' : n.type === 'hardBreak' ? '\n' : '')).join('');
}

/** Parse TipTap JSON into slide groups. Splits at --- (horizontalRule) first, falls back to headings. */
function parseSlides(json: JSONContent, noteTitle: string): ParsedSlide[] {
  const nodes = json.content || [];
  const hasHr = nodes.some((n) => n.type === 'horizontalRule');

  const slides: ParsedSlide[] = [];

  if (hasHr) {
    // --- delimited mode
    let current: ParsedSlide = { type: 'content', bullets: [] };
    for (const node of nodes) {
      if (node.type === 'horizontalRule') {
        if (current.bullets.length > 0 || current.heading || current.quoteText || current.imageSrc) {
          slides.push(current);
        }
        current = { type: 'content', bullets: [] };
        continue;
      }
      addNodeToSlide(current, node);
    }
    if (current.bullets.length > 0 || current.heading || current.quoteText || current.imageSrc) {
      slides.push(current);
    }
  } else {
    // Heading-based splitting
    let current: ParsedSlide | null = null;
    for (const node of nodes) {
      if (node.type === 'heading') {
        if (current && (current.bullets.length > 0 || current.heading)) slides.push(current);
        const level = node.attrs?.level || 1;
        const text = getPlainText(node.content);
        current = {
          type: level === 1 ? 'section' : 'content',
          heading: text,
          bullets: [],
        };
        continue;
      }
      if (!current) current = { type: 'content', bullets: [] };
      addNodeToSlide(current, node);
      if (current.bullets.length >= 6) {
        slides.push(current);
        current = { type: 'content', bullets: [] };
      }
    }
    if (current && (current.bullets.length > 0 || current.heading)) slides.push(current);
  }

  // Prepend a title slide
  slides.unshift({ type: 'title', heading: noteTitle, bullets: [] });
  return slides;
}

function addNodeToSlide(slide: ParsedSlide, node: any) {
  switch (node.type) {
    case 'paragraph': {
      const text = getPlainText(node.content);
      if (text.trim()) slide.bullets.push(text);
      break;
    }
    case 'bulletList':
    case 'orderedList':
      (node.content || []).forEach((li: any, i: number) => {
        const prefix = node.type === 'orderedList' ? `${i + 1}. ` : '';
        const text = getPlainText(li.content?.[0]?.content);
        if (text.trim()) slide.bullets.push(prefix + text);
      });
      break;
    case 'taskList':
      (node.content || []).forEach((li: any) => {
        const checked = li.attrs?.checked ? '\u2611 ' : '\u2610 ';
        const text = getPlainText(li.content?.[0]?.content);
        if (text.trim()) slide.bullets.push(checked + text);
      });
      break;
    case 'blockquote':
    case 'transcriptEmbed': {
      const parts =
        node.type === 'transcriptEmbed'
          ? [node.attrs?.transcription || '']
          : (node.content || []).map((c: any) => getPlainText(c.content));
      // Convert last slide to quote if short enough, otherwise add as bullets
      if (parts.join(' ').length < 300) {
        slide.type = 'quote';
        slide.quoteText = parts.join(' ');
        if (node.type === 'transcriptEmbed') {
          slide.quoteSpeaker = `${node.attrs?.speaker || ''} — ${node.attrs?.interviewTitle || ''}`;
        }
      } else {
        slide.bullets.push(...parts);
      }
      break;
    }
    case 'image':
      slide.type = 'image';
      slide.imageSrc = node.attrs?.src;
      break;
    case 'codeBlock':
      slide.bullets.push(getPlainText(node.content));
      break;
    case 'heading':
      if (!slide.heading) slide.heading = getPlainText(node.content);
      else slide.bullets.push(getPlainText(node.content));
      break;
  }
}

const themeStyles: Record<
  SlideTheme,
  { bg: string; text: string; muted: string; sectionBg: (c: string) => string; sectionText: string }
> = {
  light: { bg: '#F8F9FA', text: '#222', muted: '#888', sectionBg: (c) => c, sectionText: '#fff' },
  dark: { bg: '#1a1a2e', text: '#eee', muted: '#888', sectionBg: () => '#16213e', sectionText: '#eee' },
  brand: { bg: '#ffffff', text: '#222', muted: '#888', sectionBg: (c) => c, sectionText: '#fff' },
};

function SlideCard({
  slide,
  theme,
  accentColor,
  orgName,
  dateStr,
}: {
  slide: ParsedSlide;
  theme: SlideTheme;
  accentColor: string;
  orgName: string;
  dateStr: string;
}) {
  const s = themeStyles[theme];

  // Slide dimensions (16:9 scaled to ~280px wide)
  const w = 280;
  const h = w * (9 / 16);

  switch (slide.type) {
    case 'title':
      return (
        <Box
          sx={{
            width: w,
            height: h,
            bgcolor: '#fff',
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
            p: 2,
          }}>
          <Typography sx={{ fontSize: '6px', color: '#999', mb: 0.5 }}>{orgName}</Typography>
          <Box sx={{ width: '100%', height: 1.5, bgcolor: accentColor, my: 0.5 }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#222', mt: 0.5, lineHeight: 1.2 }}>
            {slide.heading}
          </Typography>
          <Typography sx={{ fontSize: '6px', color: '#aaa', position: 'absolute', bottom: 8, left: 16 }}>
            {dateStr}
          </Typography>
        </Box>
      );

    case 'section':
      return (
        <Box
          sx={{
            width: w,
            height: h,
            bgcolor: s.sectionBg(accentColor),
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            p: 2,
          }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: s.sectionText, lineHeight: 1.2 }}>
            {slide.heading}
          </Typography>
        </Box>
      );

    case 'quote':
      return (
        <Box
          sx={{
            width: w,
            height: h,
            bgcolor: s.bg,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            flexShrink: 0,
            p: 2,
            position: 'relative',
          }}>
          <Box
            sx={{
              position: 'absolute',
              left: 4,
              top: 0,
              width: 3,
              height: '100%',
              bgcolor: accentColor,
              borderRadius: 1,
            }}
          />
          <Typography sx={{ fontSize: '24px', fontWeight: 700, color: accentColor, lineHeight: 1, ml: 1 }}>
            {'\u201C'}
          </Typography>
          <Typography sx={{ fontSize: '8px', fontStyle: 'italic', color: s.text, lineHeight: 1.5, ml: 1, mt: 0.25 }}>
            {(slide.quoteText || '').slice(0, 250)}
            {(slide.quoteText || '').length > 250 ? '...' : ''}
          </Typography>
          {slide.quoteSpeaker && (
            <Typography sx={{ fontSize: '6px', color: s.muted, ml: 1, mt: 0.5 }}>— {slide.quoteSpeaker}</Typography>
          )}
        </Box>
      );

    case 'image':
      return (
        <Box
          sx={{
            width: w,
            height: h,
            bgcolor: s.bg,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {slide.imageSrc && (
            <Box
              component="img"
              src={slide.imageSrc}
              sx={{ maxWidth: '90%', maxHeight: '85%', objectFit: 'contain', borderRadius: 0.5 }}
            />
          )}
        </Box>
      );

    default: // content
      return (
        <Box
          sx={{
            width: w,
            height: h,
            bgcolor: s.bg,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            flexShrink: 0,
            p: 2,
            position: 'relative',
          }}>
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 3,
              height: '100%',
              bgcolor: accentColor,
              borderRadius: 1,
            }}
          />
          {slide.heading && (
            <>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: s.text, mb: 0.25, ml: 0.5 }}>
                {slide.heading}
              </Typography>
              <Box sx={{ width: 20, height: 1.5, bgcolor: accentColor, mb: 0.5, ml: 0.5, borderRadius: 1 }} />
            </>
          )}
          <Box sx={{ ml: 0.5 }}>
            {slide.bullets.slice(0, 7).map((b, i) => (
              <Typography key={i} sx={{ fontSize: '7px', color: s.text, lineHeight: 1.5, mb: 0.15 }}>
                {'\u2022'} {b.slice(0, 120)}
                {b.length > 120 ? '...' : ''}
              </Typography>
            ))}
            {slide.bullets.length > 7 && (
              <Typography sx={{ fontSize: '6px', color: s.muted }}>+{slide.bullets.length - 7} more...</Typography>
            )}
          </Box>
        </Box>
      );
  }
}

export const SlidesPreview = ({ json, title, updatedAt, onExport, exporting }: SlidesPreviewProps) => {
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('light');
  const [accentColor, setAccentColor] = useState(themeColors.primary.main);

  const slides = useMemo(() => parseSlides(json, title), [json, title]);
  const dateStr = new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const orgName = organizationConfig.displayName || organizationConfig.name;

  const handleExport = () => {
    onExport({
      title,
      accentColor,
      theme: slideTheme,
      updatedAt,
      orgName,
      orgLogoPath: organizationConfig.logo?.path,
    });
  };

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Controls sidebar */}
      <Box
        sx={{
          width: 240,
          minWidth: 240,
          borderRight: '1px solid',
          borderColor: 'divider',
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.7rem' }}>
          Slide Settings
        </Typography>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Theme
          </Typography>
          <ToggleButtonGroup
            value={slideTheme}
            exclusive
            onChange={(_, v) => v && setSlideTheme(v)}
            size="small"
            fullWidth>
            <ToggleButton value="light" sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              Light
            </ToggleButton>
            <ToggleButton value="dark" sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              Dark
            </ToggleButton>
            <ToggleButton value="brand" sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              Brand
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Accent color
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {[
              themeColors.primary.main,
              themeColors.secondary.main,
              '#e53935',
              '#FB8C00',
              '#43A047',
              '#5E35B1',
              '#222222',
            ].map((c) => (
              <Tooltip key={c} title={c}>
                <IconButton
                  size="small"
                  onClick={() => setAccentColor(c)}
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: c,
                    border: accentColor === c ? '2px solid #000' : '2px solid transparent',
                    borderRadius: '50%',
                    '&:hover': { bgcolor: c, opacity: 0.85 },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary">
          {slides.length} slide{slides.length !== 1 ? 's' : ''} generated. Use{' '}
          <code style={{ fontSize: '0.7rem', background: '#f0f0f0', padding: '1px 4px', borderRadius: 3 }}>---</code> in
          your note to control where slides break.
        </Typography>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
          sx={{ mt: 'auto', textTransform: 'none' }}>
          {exporting ? 'Exporting...' : 'Export PPTX'}
        </Button>
      </Box>

      {/* Slide preview area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: '#e8e8e8',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
        {slides.map((slide, i) => (
          <Box key={i} sx={{ position: 'relative' }}>
            <Typography sx={{ fontSize: '9px', color: '#999', position: 'absolute', top: -14, left: 0 }}>
              {i + 1}
            </Typography>
            <SlideCard slide={slide} theme={slideTheme} accentColor={accentColor} orgName={orgName} dateStr={dateStr} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
