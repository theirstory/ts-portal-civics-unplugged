 
import type { JSONContent } from '@tiptap/react';

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  updatedAt: string;
  orgName: string;
  orgLogoPath?: string;
  primaryColor: string;
  showLogo?: boolean;
}

/** Extract plain text from TipTap inline content nodes */
function getPlainText(content?: any[]): string {
  if (!content) return '';
  return content.map((n) => (n.type === 'text' ? n.text || '' : n.type === 'hardBreak' ? '\n' : '')).join('');
}

/** Hex color string to [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

export async function exportNoteToPdf(json: JSONContent, options: PdfExportOptions) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 60;
  const contentW = pageW - margin * 2;
  const [pr, pg, pb] = hexToRgb(options.primaryColor);
  let y = margin;

  // ── Title Page ──────────────────────────────────────────────────────

  // Try to load org logo
  try {
    if (options.orgLogoPath) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = options.orgLogoPath!;
      });
      if (img.naturalWidth > 0) {
        const logoH = 40;
        const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
        doc.addImage(img, 'PNG', margin, margin, logoW, logoH);
      }
    }
  } catch {
    // skip logo on error
  }

  // Accent line
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(3);
  doc.line(margin, pageH * 0.42, margin + contentW, pageH * 0.42);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  const titleLines = doc.splitTextToSize(options.title, contentW) as string[];
  let titleY = pageH * 0.42 + 40;
  for (const line of titleLines) {
    doc.text(line, margin, titleY);
    titleY += 34;
  }

  // Subtitle
  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.text(options.subtitle, margin, titleY + 4);
    titleY += 20;
  }

  // Org name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text(options.orgName, margin, pageH * 0.42 - 16);

  // Date
  const dateStr = new Date(options.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(11);
  doc.setTextColor(140, 140, 140);
  doc.text(dateStr, margin, titleY + 8);

  // ── Content Pages ───────────────────────────────────────────────────
  doc.addPage();
  y = margin + 16;

  // Draw header accent on current page
  const drawPageHeader = () => {
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(1.5);
    doc.line(margin, margin - 8, margin + contentW, margin - 8);
  };

  drawPageHeader();

  const checkPage = (needed: number) => {
    if (y + needed > pageH - margin - 20) {
      doc.addPage();
      y = margin + 16;
      drawPageHeader();
    }
  };

  const drawWrapped = (
    text: string,
    fontSize: number,
    style: 'normal' | 'bold' | 'italic' | 'bolditalic',
    indent: number,
    align: string,
    color?: [number, number, number],
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.setTextColor(...(color || [40, 40, 40]));
    const maxW = contentW - indent;
    const lines = doc.splitTextToSize(text, maxW) as string[];
    const lineH = fontSize * 1.5;
    for (const line of lines) {
      checkPage(lineH);
      let x = margin + indent;
      if (align === 'center') x = margin + indent + (maxW - doc.getTextWidth(line)) / 2;
      else if (align === 'right') x = margin + indent + maxW - doc.getTextWidth(line);
      doc.text(line, x, y);
      y += lineH;
    }
  };

  const drawImage = async (src: string, imgWidth: number | null, align: string) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = src;
      });
      const maxW = Math.min(imgWidth || contentW, contentW);
      const ratio = img.naturalHeight / img.naturalWidth;
      const w = maxW;
      const h = w * ratio;
      checkPage(h + 12);
      let x = margin;
      if (align === 'center') x = margin + (contentW - w) / 2;
      else if (align === 'right') x = margin + contentW - w;
      doc.addImage(img, 'JPEG', x, y, w, h);
      y += h + 12;
    } catch {
      // skip images that fail to load
    }
  };

  const drawListItems = (items: any[], ordered: boolean, indent: number) => {
    items?.forEach((li, i) => {
      const prefix = ordered ? `${i + 1}. ` : '\u2022 ';
      const paragraphs = li.content || [];
      paragraphs.forEach((child: any) => {
        if (child.type === 'paragraph') {
          drawWrapped(prefix + getPlainText(child.content), 10.5, 'normal', indent, 'left');
        } else if (child.type === 'bulletList') {
          drawListItems(child.content, false, indent + 18);
        } else if (child.type === 'orderedList') {
          drawListItems(child.content, true, indent + 18);
        }
      });
    });
  };

  // ── Render content nodes ────────────────────────────────────────────
  for (const node of json.content || []) {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 1;
        const size = level === 1 ? 20 : level === 2 ? 15 : 12.5;
        const text = getPlainText(node.content);
        y += level === 1 ? 16 : 10;
        checkPage(size * 2);

        // Accent line under H1
        if (level === 1) {
          drawWrapped(text, size, 'bold', 0, node.attrs?.textAlign || 'left');
          doc.setDrawColor(pr, pg, pb);
          doc.setLineWidth(1.5);
          doc.line(margin, y + 2, margin + Math.min(doc.getTextWidth(text) * 1.2, contentW * 0.4), y + 2);
          y += 10;
        } else {
          drawWrapped(text, size, 'bold', 0, node.attrs?.textAlign || 'left');
          y += 4;
        }
        break;
      }
      case 'paragraph': {
        const text = getPlainText(node.content);
        if (text.trim()) {
          drawWrapped(text, 10.5, 'normal', 0, node.attrs?.textAlign || 'left');
        }
        y += 6;
        break;
      }
      case 'bulletList':
        drawListItems(node.content || [], false, 18);
        y += 6;
        break;
      case 'orderedList':
        drawListItems(node.content || [], true, 18);
        y += 6;
        break;
      case 'taskList':
        (node.content || []).forEach((li: any) => {
          const checked = li.attrs?.checked ? '\u2611 ' : '\u2610 ';
          drawWrapped(checked + getPlainText(li.content?.[0]?.content), 10.5, 'normal', 18, 'left');
        });
        y += 6;
        break;
      case 'blockquote': {
        (node.content || []).forEach((child: any) => {
          const text = getPlainText(child.content);
          const startY = y;
          drawWrapped(text, 10.5, 'italic', 16, 'left', [100, 100, 100]);
          doc.setDrawColor(pr, pg, pb);
          doc.setLineWidth(2.5);
          doc.line(margin + 4, startY - 12, margin + 4, y - 2);
        });
        y += 6;
        break;
      }
      case 'codeBlock': {
        const code = getPlainText(node.content);
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(code, contentW - 20) as string[];
        const blockH = lines.length * 12 + 16;
        checkPage(blockH);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y - 6, contentW, blockH, 4, 4, 'F');
        doc.setTextColor(50, 50, 50);
        for (const line of lines) {
          y += 12;
          doc.text(line, margin + 10, y);
        }
        y += 16;
        doc.setFont('helvetica', 'normal');
        break;
      }
      case 'image':
        await drawImage(node.attrs?.src || '', node.attrs?.width || null, node.attrs?.align || 'center');
        break;
      case 'horizontalRule':
        checkPage(16);
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.5);
        doc.line(margin + contentW * 0.2, y, margin + contentW * 0.8, y);
        y += 16;
        break;
      case 'transcriptEmbed': {
        const a = node.attrs || {};
        const startY = y;
        drawWrapped(`${a.speaker || ''} — ${a.interviewTitle || ''}`, 10.5, 'bolditalic', 16, 'left', [60, 60, 60]);
        drawWrapped(a.transcription || '', 10, 'italic', 16, 'left', [100, 100, 100]);
        doc.setDrawColor(pr, pg, pb);
        doc.setLineWidth(2.5);
        doc.line(margin + 4, startY - 12, margin + 4, y - 2);
        y += 6;
        break;
      }
      case 'videoEmbed': {
        const a = node.attrs || {};
        drawWrapped(`[Video: ${a.interviewTitle || ''}]`, 10, 'italic', 0, 'left', [140, 140, 140]);
        y += 6;
        break;
      }
    }
  }

  // ── Page numbers (skip title page) ──────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(160, 160, 160);
    const pageText = `${i - 1} / ${totalPages - 1}`;
    doc.text(pageText, pageW / 2 - doc.getTextWidth(pageText) / 2, pageH - 30);
  }

  doc.save(`${options.title || 'Untitled'}.pdf`);
}
