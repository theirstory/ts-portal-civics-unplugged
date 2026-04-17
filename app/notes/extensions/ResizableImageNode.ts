import { Node, mergeAttributes } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageView } from '../Components/ResizableImageView';

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: { src: string; alt?: string; title?: string; width?: number }) => ReturnType;
    };
  }
}

export const ResizableImageNode = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      align: { default: 'center' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; title?: string; width?: number }) =>
         
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
