import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NoteLinkView } from '../Components/NoteLinkView';

export interface NoteLinkAttrs {
  noteId: string;
  noteTitle: string;
}

export const NoteLinkNode = Node.create({
  name: 'noteLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      noteId: { default: '' },
      noteTitle: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="note-link"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'note-link' }), `[[${HTMLAttributes.noteTitle}]]`];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteLinkView);
  },

  addKeyboardShortcuts() {
    return {
      // When user types "[[", trigger the note link insertion
    };
  },
});
