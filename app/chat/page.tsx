import { Suspense } from 'react';
import { RagChatLayout } from '@/components/RagChat/RagChatLayout';

export const metadata = {
  title: 'Collection Chat',
};

export default function ChatPage() {
  return (
    <Suspense>
      <RagChatLayout />
    </Suspense>
  );
}
