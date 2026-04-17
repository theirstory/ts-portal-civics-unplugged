'use client';

 
import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, TextField, Switch, FormControlLabel, IconButton, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { organizationConfig, themeColors } from '@/config/organizationConfig';
import type { JSONContent } from '@tiptap/react';

interface PagesPreviewProps {
  json: JSONContent;
  title: string;
  updatedAt: string;
  onExport: (options: PdfCustomization) => void;
  exporting: boolean;
}

export interface PdfCustomization {
  title: string;
  subtitle: string;
  accentColor: string;
  showLogo: boolean;
  updatedAt: string;
  orgName: string;
  orgLogoPath?: string;
}

/** Extract plain text from TipTap JSON inline content */
function getPlainText(content?: any[]): string {
  if (!content) return '';
  return content.map((n) => (n.type === 'text' ? n.text || '' : n.type === 'hardBreak' ? '\n' : '')).join('');
}

/** Split TipTap JSON content into rough "pages" based on estimated line count */
function paginateContent(json: JSONContent): any[][] {
  const pages: any[][] = [];
  let currentPage: any[] = [];
  let linesUsed = 0;
  const maxLines = 42; // approximate lines per letter page at 10.5pt

  for (const node of json.content || []) {
    let nodeLines = 1;
    switch (node.type) {
      case 'heading':
        nodeLines = 3;
        break;
      case 'paragraph': {
        const text = getPlainText(node.content);
        nodeLines = Math.max(1, Math.ceil(text.length / 80));
        break;
      }
      case 'image':
        nodeLines = 12;
        break;
      case 'blockquote':
      case 'transcriptEmbed':
        nodeLines = 4;
        break;
      case 'codeBlock': {
        const code = getPlainText(node.content);
        nodeLines = Math.max(2, code.split('\n').length + 2);
        break;
      }
      case 'bulletList':
      case 'orderedList':
      case 'taskList':
        nodeLines = (node.content || []).length + 1;
        break;
      case 'horizontalRule':
        nodeLines = 2;
        break;
    }

    if (linesUsed + nodeLines > maxLines && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      linesUsed = 0;
    }
    currentPage.push(node);
    linesUsed += nodeLines;
  }
  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

/** Mini renderer — turns TipTap JSON nodes into simple React elements for preview */
function RenderNode({ node, accentColor }: { node: any; accentColor: string }) {
  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 1;
      const text = getPlainText(node.content);
      const sizes = { 1: '13px', 2: '11px', 3: '9.5px' };
      return (
        <Box sx={{ mt: 0.5, mb: 0.25 }}>
          <Typography
            sx={{
              fontSize: sizes[level as 1 | 2 | 3] || '11px',
              fontWeight: 700,
              lineHeight: 1.3,
              textAlign: node.attrs?.textAlign,
            }}>
            {text}
          </Typography>
          {level === 1 && <Box sx={{ width: 24, height: 1.5, bgcolor: accentColor, mt: 0.25, borderRadius: 1 }} />}
        </Box>
      );
    }
    case 'paragraph': {
      const text = getPlainText(node.content);
      if (!text.trim()) return <Box sx={{ height: 4 }} />;
      return (
        <Typography
          sx={{ fontSize: '7px', lineHeight: 1.5, mb: 0.25, textAlign: node.attrs?.textAlign, color: '#333' }}>
          {text}
        </Typography>
      );
    }
    case 'bulletList':
    case 'orderedList':
      return (
        <Box sx={{ pl: 1, mb: 0.25 }}>
          {(node.content || []).map((li: any, i: number) => {
            const text = getPlainText(li.content?.[0]?.content);
            const prefix = node.type === 'orderedList' ? `${i + 1}. ` : '\u2022 ';
            return (
              <Typography key={i} sx={{ fontSize: '7px', lineHeight: 1.5, color: '#333' }}>
                {prefix}
                {text}
              </Typography>
            );
          })}
        </Box>
      );
    case 'taskList':
      return (
        <Box sx={{ pl: 1, mb: 0.25 }}>
          {(node.content || []).map((li: any, i: number) => {
            const checked = li.attrs?.checked ? '\u2611 ' : '\u2610 ';
            const text = getPlainText(li.content?.[0]?.content);
            return (
              <Typography key={i} sx={{ fontSize: '7px', lineHeight: 1.5, color: '#333' }}>
                {checked}
                {text}
              </Typography>
            );
          })}
        </Box>
      );
    case 'blockquote':
      return (
        <Box sx={{ borderLeft: `2px solid ${accentColor}`, pl: 0.75, my: 0.25 }}>
          {(node.content || []).map((child: any, i: number) => (
            <Typography key={i} sx={{ fontSize: '7px', lineHeight: 1.5, fontStyle: 'italic', color: '#666' }}>
              {getPlainText(child.content)}
            </Typography>
          ))}
        </Box>
      );
    case 'codeBlock':
      return (
        <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 0.5, p: 0.5, my: 0.25 }}>
          <Typography sx={{ fontSize: '6px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#444' }}>
            {getPlainText(node.content)}
          </Typography>
        </Box>
      );
    case 'image': {
      const { src, width, align } = node.attrs || {};
      const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
      return (
        <Box sx={{ display: 'flex', justifyContent: justify, my: 0.5 }}>
          <Box
            component="img"
            src={src}
            sx={{
              maxWidth: width ? Math.min(width * 0.25, 140) : 140,
              maxHeight: 80,
              borderRadius: 0.5,
              objectFit: 'contain',
            }}
          />
        </Box>
      );
    }
    case 'horizontalRule':
      return <Box sx={{ borderTop: '1px solid #ddd', my: 0.5 }} />;
    case 'transcriptEmbed': {
      const a = node.attrs || {};
      return (
        <Box sx={{ borderLeft: `2px solid ${accentColor}`, pl: 0.75, my: 0.25 }}>
          <Typography sx={{ fontSize: '6.5px', fontWeight: 600, fontStyle: 'italic', color: '#444' }}>
            {a.speaker} — {a.interviewTitle}
          </Typography>
          <Typography sx={{ fontSize: '6px', fontStyle: 'italic', color: '#666' }}>
            {(a.transcription || '').slice(0, 200)}...
          </Typography>
        </Box>
      );
    }
    default:
      return null;
  }
}

export const PagesPreview = ({ json, title, updatedAt, onExport, exporting }: PagesPreviewProps) => {
  const [customTitle, setCustomTitle] = useState(title);
  const [subtitle, setSubtitle] = useState('');
  const [accentColor, setAccentColor] = useState(themeColors.primary.main);
  const [showLogo, setShowLogo] = useState(true);

  const pages = useMemo(() => paginateContent(json), [json]);
  const dateStr = new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleExport = () => {
    onExport({
      title: customTitle,
      subtitle,
      accentColor,
      showLogo,
      updatedAt,
      orgName: organizationConfig.displayName || organizationConfig.name,
      orgLogoPath: showLogo ? organizationConfig.logo?.path : undefined,
    });
  };

  // Page dimensions in px (scaled down ~0.22x from letter 612x792pt)
  const pageW = 170;
  const pageH = 220;
  const pagePad = 12;

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
          PDF Settings
        </Typography>

        <TextField
          label="Title"
          size="small"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label="Subtitle"
          size="small"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          fullWidth
          placeholder="e.g. Prepared by..."
        />
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

        <FormControlLabel
          control={<Switch checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} size="small" />}
          label={<Typography variant="body2">Show logo</Typography>}
        />

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
          sx={{ mt: 'auto', textTransform: 'none' }}>
          {exporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </Box>

      {/* Page preview area */}
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
        {/* Title page */}
        <Box
          sx={{
            width: pageW,
            height: pageH,
            bgcolor: '#fff',
            borderRadius: 0.5,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            p: `${pagePad}px`,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
          {/* Logo */}
          {showLogo && organizationConfig.logo?.path && (
            <Box component="img" src={organizationConfig.logo.path} sx={{ height: 10, mb: 0.5, display: 'block' }} />
          )}
          {/* Org name */}
          <Typography sx={{ fontSize: '5.5px', color: '#999', mt: pageH * 0.15 + 'px', mb: 0.25 }}>
            {organizationConfig.displayName || organizationConfig.name}
          </Typography>
          {/* Accent line */}
          <Box sx={{ width: '100%', height: 2, bgcolor: accentColor, my: 0.5 }} />
          {/* Title */}
          <Typography sx={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2, color: '#222', mt: 0.5 }}>
            {customTitle}
          </Typography>
          {/* Subtitle */}
          {subtitle && <Typography sx={{ fontSize: '7px', color: '#666', mt: 0.5 }}>{subtitle}</Typography>}
          {/* Date */}
          <Typography sx={{ fontSize: '6px', color: '#aaa', position: 'absolute', bottom: pagePad, left: pagePad }}>
            {dateStr}
          </Typography>
        </Box>

        {/* Content pages */}
        {pages.map((pageNodes, pageIdx) => (
          <Box
            key={pageIdx}
            sx={{
              width: pageW,
              height: pageH,
              bgcolor: '#fff',
              borderRadius: 0.5,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              p: `${pagePad}px`,
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
            {/* Header accent line */}
            <Box sx={{ width: '100%', height: 1, bgcolor: accentColor, mb: 0.75 }} />
            {/* Content */}
            {pageNodes.map((node: any, i: number) => (
              <RenderNode key={i} node={node} accentColor={accentColor} />
            ))}
            {/* Page number */}
            <Typography
              sx={{
                fontSize: '5px',
                color: '#bbb',
                position: 'absolute',
                bottom: 6,
                left: '50%',
                transform: 'translateX(-50%)',
              }}>
              {pageIdx + 1} / {pages.length}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
