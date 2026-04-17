 
import type { JSONContent } from '@tiptap/react';

export interface SlideExportOptions {
  title: string;
  updatedAt: string;
  orgName: string;
  orgLogoPath?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  theme?: 'light' | 'dark' | 'brand';
}

/** Extract plain text from TipTap inline content nodes */
function getPlainText(content?: any[]): string {
  if (!content) return '';
  return content.map((n) => (n.type === 'text' ? n.text || '' : n.type === 'hardBreak' ? '\n' : '')).join('');
}

/** Collect list items as flat text strings */
function collectListText(items: any[], ordered: boolean): string[] {
  const result: string[] = [];
  items?.forEach((li, i) => {
    const prefix = ordered ? `${i + 1}. ` : '';
    (li.content || []).forEach((child: any) => {
      if (child.type === 'paragraph') {
        result.push(prefix + getPlainText(child.content));
      } else if (child.type === 'bulletList') {
        result.push(...collectListText(child.content, false).map((t) => '   ' + t));
      } else if (child.type === 'orderedList') {
        result.push(...collectListText(child.content, true).map((t) => '   ' + t));
      }
    });
  });
  return result;
}

export async function exportNoteToSlides(json: JSONContent, options: SlideExportOptions) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.author = options.orgName;
  pptx.title = options.title;

  const primary = (options.accentColor || options.primaryColor).replace('#', '');
  const slideTheme = options.theme || 'light';
  const bgColors = { light: 'F8F9FA', dark: '1a1a2e', brand: 'FFFFFF' };
  const textColors = { light: '222222', dark: 'EEEEEE', brand: '222222' };
  const sectionBgs = { light: primary, dark: '16213e', brand: primary };
  const bgLight = bgColors[slideTheme];
  const textColor = textColors[slideTheme];
  const sectionBg = sectionBgs[slideTheme];

  // ── Helper: add accent bar to content slides ────────────────────────
  const addAccentBar = (slide: any) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.08,
      h: '100%',
      fill: { color: primary.replace('#', '') },
    });
  };

  // ── Title Slide ─────────────────────────────────────────────────────
  const titleSlide = pptx.addSlide();
  titleSlide.background = { fill: 'FFFFFF' };

  // Accent bar at top
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 3.2,
    w: '100%',
    h: 0.04,
    fill: { color: primary.replace('#', '') },
  });

  // Org name
  titleSlide.addText(options.orgName, {
    x: 0.8,
    y: 1.0,
    w: 11,
    h: 0.5,
    fontSize: 14,
    color: '888888',
    fontFace: 'Arial',
  });

  // Title
  titleSlide.addText(options.title, {
    x: 0.8,
    y: 3.6,
    w: 11,
    h: 2.0,
    fontSize: 36,
    bold: true,
    color: '222222',
    fontFace: 'Arial',
    valign: 'top',
  });

  // Date
  const dateStr = new Date(options.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  titleSlide.addText(dateStr, {
    x: 0.8,
    y: 6.2,
    w: 11,
    h: 0.4,
    fontSize: 12,
    color: 'AAAAAA',
    fontFace: 'Arial',
  });

  // ── Parse content into slide groups ─────────────────────────────────
  // Strategy: H1 = section title slide, H2 = content slide title
  // Content between headings becomes body of the current slide

  interface SlideGroup {
    type: 'title' | 'content' | 'quote' | 'image';
    heading?: string;
    bullets: string[];
    imageSrc?: string;
    imageWidth?: number;
    quoteText?: string;
    quoteSpeaker?: string;
  }

  const groups: SlideGroup[] = [];
  let current: SlideGroup | null = null;

  const flushCurrent = () => {
    if (current && (current.bullets.length > 0 || current.heading || current.imageSrc || current.quoteText)) {
      groups.push(current);
    }
    current = null;
  };

  for (const node of json.content || []) {
    switch (node.type) {
      case 'heading': {
        flushCurrent();
        const level = node.attrs?.level || 1;
        const text = getPlainText(node.content);
        if (level === 1) {
          groups.push({ type: 'title', heading: text, bullets: [] });
        } else {
          current = { type: 'content', heading: text, bullets: [] };
        }
        break;
      }
      case 'paragraph': {
        const text = getPlainText(node.content);
        if (text.trim()) {
          if (!current) current = { type: 'content', bullets: [] };
          current.bullets.push(text);
        }
        // Auto-split if too many bullets on one slide
        if (current && current.bullets.length >= 6) {
          flushCurrent();
        }
        break;
      }
      case 'bulletList':
      case 'orderedList': {
        const items = collectListText(node.content || [], node.type === 'orderedList');
        if (!current) current = { type: 'content', bullets: [] };
        current.bullets.push(...items);
        if (current.bullets.length >= 6) flushCurrent();
        break;
      }
      case 'taskList': {
        if (!current) current = { type: 'content', bullets: [] };
        (node.content || []).forEach((li: any) => {
          const checked = li.attrs?.checked ? '\u2611 ' : '\u2610 ';
          current!.bullets.push(checked + getPlainText(li.content?.[0]?.content));
        });
        break;
      }
      case 'blockquote': {
        flushCurrent();
        const parts = (node.content || []).map((child: any) => getPlainText(child.content));
        groups.push({ type: 'quote', quoteText: parts.join(' '), bullets: [] });
        break;
      }
      case 'transcriptEmbed': {
        flushCurrent();
        const a = node.attrs || {};
        groups.push({
          type: 'quote',
          quoteText: a.transcription || '',
          quoteSpeaker: `${a.speaker || ''} — ${a.interviewTitle || ''}`,
          bullets: [],
        });
        break;
      }
      case 'image': {
        flushCurrent();
        groups.push({
          type: 'image',
          imageSrc: node.attrs?.src,
          imageWidth: node.attrs?.width,
          bullets: [],
        });
        break;
      }
      case 'codeBlock': {
        if (!current) current = { type: 'content', bullets: [] };
        current.bullets.push(getPlainText(node.content));
        break;
      }
      // horizontalRule, videoEmbed — skip
    }
  }
  flushCurrent();

  // ── Render slide groups ─────────────────────────────────────────────
  for (const group of groups) {
    const slide = pptx.addSlide();

    switch (group.type) {
      case 'title': {
        slide.background = { fill: sectionBg };
        slide.addText(group.heading || '', {
          x: 0.8,
          y: 2.0,
          w: 11,
          h: 3.0,
          fontSize: 32,
          bold: true,
          color: slideTheme === 'dark' ? 'EEEEEE' : 'FFFFFF',
          fontFace: 'Arial',
          valign: 'middle',
        });
        break;
      }
      case 'content': {
        slide.background = { fill: bgLight };
        addAccentBar(slide);

        if (group.heading) {
          slide.addText(group.heading, {
            x: 0.6,
            y: 0.4,
            w: 12,
            h: 0.8,
            fontSize: 24,
            bold: true,
            color: textColor,
            fontFace: 'Arial',
          });
          // Accent underline
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.6,
            y: 1.2,
            w: 2.0,
            h: 0.03,
            fill: { color: primary.replace('#', '') },
          });
        }

        const bodyY = group.heading ? 1.5 : 0.6;
        const bodyText = group.bullets.map((b) => ({
          text: b,
          options: {
            fontSize: 16,
            color: slideTheme === 'dark' ? 'CCCCCC' : '444444',
            bullet: { indent: 18 },
            breakLine: true,
          } as any,
        }));

        if (bodyText.length > 0) {
          slide.addText(bodyText, {
            x: 0.6,
            y: bodyY,
            w: 11.5,
            h: 7.5 - bodyY - 0.5,
            fontFace: 'Arial',
            valign: 'top',
            lineSpacing: 28,
          });
        }
        break;
      }
      case 'quote': {
        slide.background = { fill: 'FFFFFF' };
        addAccentBar(slide);

        // Large accent quote mark
        slide.addText('\u201C', {
          x: 0.6,
          y: 0.8,
          w: 1,
          h: 1,
          fontSize: 72,
          color: primary.replace('#', ''),
          fontFace: 'Georgia',
          bold: true,
        });

        slide.addText(group.quoteText || '', {
          x: 1.2,
          y: 1.8,
          w: 10.5,
          h: 4.0,
          fontSize: 20,
          italic: true,
          color: '333333',
          fontFace: 'Georgia',
          valign: 'top',
          lineSpacing: 32,
        });

        if (group.quoteSpeaker) {
          slide.addText(`— ${group.quoteSpeaker}`, {
            x: 1.2,
            y: 5.8,
            w: 10.5,
            h: 0.5,
            fontSize: 13,
            color: '888888',
            fontFace: 'Arial',
          });
        }
        break;
      }
      case 'image': {
        slide.background = { fill: 'FFFFFF' };
        if (group.imageSrc) {
          try {
            // For base64 images, use data directly
            if (group.imageSrc.startsWith('data:')) {
              slide.addImage({
                data: group.imageSrc,
                x: 1.5,
                y: 0.75,
                w: 10,
                h: 6,
                sizing: { type: 'contain', w: 10, h: 6 },
              });
            } else {
              slide.addImage({
                path: group.imageSrc,
                x: 1.5,
                y: 0.75,
                w: 10,
                h: 6,
                sizing: { type: 'contain', w: 10, h: 6 },
              });
            }
          } catch {
            // skip broken images
          }
        }
        break;
      }
    }
  }

  // ── Closing Slide ───────────────────────────────────────────────────
  const closingSlide = pptx.addSlide();
  closingSlide.background = { fill: primary.replace('#', '') };
  closingSlide.addText(options.orgName, {
    x: 0,
    y: 2.5,
    w: '100%',
    h: 2.0,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
    align: 'center',
    valign: 'middle',
  });

  await pptx.writeFile({ fileName: `${options.title || 'Untitled'}.pptx` });
}
