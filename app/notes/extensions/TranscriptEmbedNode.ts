import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TranscriptEmbedView } from '../Components/TranscriptEmbedView';

export interface TranscriptEmbedAttrs {
  theirstoryId: string;
  interviewTitle: string;
  speaker: string;
  sectionTitle: string;
  startTime: number;
  endTime: number;
  transcription: string;
  videoUrl: string;
  isAudioFile: boolean;
}

export const TranscriptEmbedNode = Node.create({
  name: 'transcriptEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      theirstoryId: { default: '' },
      interviewTitle: { default: '' },
      speaker: { default: '' },
      sectionTitle: { default: '' },
      startTime: { default: 0 },
      endTime: { default: 0 },
      transcription: { default: '' },
      videoUrl: { default: '' },
      isAudioFile: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="transcript-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'transcript-embed' }),
      [
        'blockquote',
        {},
        ['p', {}, ['strong', {}, `${HTMLAttributes.speaker} — ${HTMLAttributes.interviewTitle}`]],
        ['p', {}, HTMLAttributes.transcription],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TranscriptEmbedView);
  },
});
