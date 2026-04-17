import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Watches for [[note title]] patterns as the user types.
 * When a closing ]] is typed, it searches for a matching note
 * and replaces the text with a noteLink node.
 */
export const WikiLinkInputRule = Extension.create({
  name: 'wikiLinkInputRule',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('wikiLinkInputRule'),
        props: {
          handleTextInput(view, from, to, text) {
            if (text !== ']') return false;

            const { state } = view;
            const $from = state.doc.resolve(from);
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 200),
              $from.parentOffset,
              undefined,
              '\ufffc',
            );

            // Check if we have "[[something]" pattern (we're about to type the second "]")
            const match = textBefore.match(/\[\[([^\]]+)\]$/);
            if (!match) return false;

            const noteTitle = match[1].trim();
            if (!noteTitle) return false;

            // Find the note by title
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useNotesStore } = require('@/app/stores/useNotesStore');
            const notes = useNotesStore.getState().notes;
            const note = notes.find((n: { title: string }) => n.title.toLowerCase() === noteTitle.toLowerCase());

            if (!note) return false;

            // Calculate the position of "[[noteTitle]]" in the document
            const startOffset = $from.parentOffset - match[0].length;
            const startPos = $from.start() + startOffset;

            // Create the noteLink node
            const noteLinkNode = state.schema.nodes.noteLink?.create({
              noteId: note.id,
              noteTitle: note.title,
            });

            if (!noteLinkNode) return false;

            // Replace the text with the node
            const tr = state.tr.replaceWith(startPos, from + 1, noteLinkNode);
            view.dispatch(tr);

            // Prevent the "]" from being inserted
            return true;
          },
        },
      }),
    ];
  },
});
