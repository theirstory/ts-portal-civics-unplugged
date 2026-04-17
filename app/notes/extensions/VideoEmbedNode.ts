import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VideoEmbedView } from '../Components/VideoEmbedView';

export const VideoEmbedNode = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      theirstoryId: { default: '' },
      interviewTitle: { default: '' },
      videoUrl: { default: '' },
      isAudioFile: { default: false },
      startTime: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'video-embed' }),
      ['p', {}, `[Video: ${HTMLAttributes.interviewTitle}]`],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView);
  },
});
