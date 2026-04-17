'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

type Align = 'left' | 'center' | 'right';

const alignButtons: { value: Align; label: string; icon: string }[] = [
  { value: 'left', label: 'Align left', icon: '◧' },
  { value: 'center', label: 'Center', icon: '◻' },
  { value: 'right', label: 'Align right', icon: '◨' },
];

const justifyMap: Record<Align, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

export const ResizableImageView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { src, alt, title, width } = node.attrs;
  const [align, setAlign] = useState<Align>((node.attrs.align as Align) || 'center');
  const imgRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);

  // Sync local state when node attrs change externally (e.g. undo/redo)
  useEffect(() => {
    setAlign((node.attrs.align as Align) || 'center');
  }, [node.attrs.align]);

  const handleAlign = useCallback(
    (value: Align) => {
      setAlign(value);
      updateAttributes({ align: value });
    },
    [updateAttributes],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing(true);

      const startX = e.clientX;
      const startWidth = imgRef.current?.offsetWidth || 300;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(100, startWidth + diff);
        if (imgRef.current) {
          imgRef.current.style.width = `${newWidth}px`;
        }
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        setResizing(false);
        const diff = upEvent.clientX - startX;
        const newWidth = Math.max(100, startWidth + diff);
        updateAttributes({ width: newWidth });
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [updateAttributes],
  );

  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: justifyMap[align], maxWidth: '100%' }}>
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          outline: selected ? '2px solid #1976d2' : 'none',
          borderRadius: 4,
        }}>
        {/* Alignment toolbar — visible when selected */}
        {selected && (
          <div
            contentEditable={false}
            style={{
              position: 'absolute',
              top: -36,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 2,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '2px 4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              zIndex: 10,
              userSelect: 'none',
            }}>
            {alignButtons.map((btn) => (
              <button
                key={btn.value}
                title={btn.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAlign(btn.value);
                }}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 16,
                  background: align === btn.value ? '#e3f2fd' : 'transparent',
                  color: align === btn.value ? '#1976d2' : '#555',
                }}>
                {btn.icon}
              </button>
            ))}
          </div>
        )}

        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || undefined}
          draggable={false}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 4,
            width: width ? `${width}px` : undefined,
            cursor: 'default',
          }}
        />
        {/* Right-edge resize handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: -4,
            width: 8,
            height: '100%',
            cursor: 'ew-resize',
            background: resizing ? 'rgba(25, 118, 210, 0.3)' : 'transparent',
          }}
        />
        {/* Bottom-right corner handle (visible when selected) */}
        {selected && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 12,
              height: 12,
              borderRadius: 2,
              background: '#1976d2',
              cursor: 'nwse-resize',
            }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};
