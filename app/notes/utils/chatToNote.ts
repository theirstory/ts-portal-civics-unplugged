import { Citation } from '@/types/chat';

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

/**
 * Converts a RAG chat response (markdown text with [N] citation refs) + citations
 * into TipTap JSON document content (array of nodes).
 *
 * Each paragraph that contains citation references will have the cited transcript
 * embeds inserted as blocks immediately after the paragraph.
 */
export function chatResponseToTipTapNodes(
  content: string,
  citations: Citation[],
  options?: { includeVideo?: boolean },
): TipTapNode[] {
  const citationMap = new Map(citations.map((c) => [c.index, c]));
  const nodes: TipTapNode[] = [];

  // Split content into paragraphs
  const paragraphs = content.split(/\n\n+/);

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    // Find citation refs in this paragraph
    const citationRefs = Array.from(new Set(Array.from(para.matchAll(/\[(\d+)\]/g)).map((m) => parseInt(m[1], 10))));

    // Clean citation refs from text for the paragraph
    const cleanText = para.replace(/\[(\d+)\]/g, '').trim();
    if (!cleanText) continue;

    // Check if it's a heading (starts with # or **)
    if (cleanText.startsWith('### ')) {
      nodes.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: cleanText.replace(/^### /, '') }],
      });
    } else if (cleanText.startsWith('## ')) {
      nodes.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: cleanText.replace(/^## /, '') }],
      });
    } else if (cleanText.startsWith('# ')) {
      nodes.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: cleanText.replace(/^# /, '') }],
      });
    } else {
      // Build inline content with bold markdown support
      const inlineNodes = parseInlineMarkdown(cleanText);
      nodes.push({ type: 'paragraph', content: inlineNodes });
    }

    // Insert transcript embeds for cited sources
    for (const refIdx of citationRefs) {
      const citation = citationMap.get(refIdx);
      if (!citation) continue;

      nodes.push({
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
      });

      // Optionally insert video embed after transcript
      if (options?.includeVideo) {
        nodes.push({
          type: 'videoEmbed',
          attrs: {
            theirstoryId: citation.theirstoryId,
            interviewTitle: citation.interviewTitle,
            videoUrl: citation.videoUrl,
            isAudioFile: citation.isAudioFile || false,
            startTime: citation.startTime,
          },
        });
      }
    }
  }

  return nodes;
}

/**
 * Simple inline markdown parser for bold and italic.
 */
function parseInlineMarkdown(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  // Split by bold markers **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (!part) continue;
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      nodes.push({
        type: 'text',
        text: boldMatch[1],
        marks: [{ type: 'bold' }],
      });
    } else {
      nodes.push({ type: 'text', text: part });
    }
  }

  return nodes;
}

/**
 * Creates a single transcript embed node from a Citation.
 */
export function citationToTranscriptEmbed(citation: Citation): TipTapNode {
  return {
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
  };
}

/**
 * Creates a single video embed node from a Citation.
 */
export function citationToVideoEmbed(citation: Citation): TipTapNode {
  return {
    type: 'videoEmbed',
    attrs: {
      theirstoryId: citation.theirstoryId,
      interviewTitle: citation.interviewTitle,
      videoUrl: citation.videoUrl,
      isAudioFile: citation.isAudioFile || false,
      startTime: citation.startTime,
    },
  };
}
