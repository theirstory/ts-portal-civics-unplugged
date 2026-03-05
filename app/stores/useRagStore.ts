'use client';

import { create } from 'zustand';
import type { RagCitation, RagSearchResult } from '@/types/rag';

export type { RagCitation };

export type RagMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: RagCitation[];
  timestamp: Date;
};

export type SidePanelRecordingState = {
  type: 'recording';
  storyUuid: string;
  startTime: number;
  endTime?: number;
  storyTitle: string;
  highlightCitationId?: number;
};

export type SidePanelSearchState = {
  type: 'search';
  query: string;
  results: RagSearchResult[];
  isLoading: boolean;
};

export type SidePanelState = SidePanelRecordingState | SidePanelSearchState | null;

type RagStore = {
  messages: RagMessage[];
  isLoading: boolean;
  sidePanelState: SidePanelState;
  selectedCollectionIds: string[];

  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  setSidePanelToRecording: (state: Omit<SidePanelRecordingState, 'type'>) => void;
  searchAndShowInPanel: (query: string, collectionIds?: string[]) => Promise<void>;
  closeSidePanel: () => void;
  setSelectedCollectionIds: (ids: string[]) => void;
};

export const useRagStore = create<RagStore>((set, get) => ({
  messages: [],
  isLoading: false,
  sidePanelState: null,
  selectedCollectionIds: [],

  setSelectedCollectionIds: (ids) => set({ selectedCollectionIds: ids }),

  sendMessage: async (content: string) => {
    const userMessage: RagMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      const { messages, selectedCollectionIds } = get();
      // Build message history for the API (excluding the assistant-message placeholders)
      const apiMessages = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          collectionIds: selectedCollectionIds.length ? selectedCollectionIds : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = (await res.json()) as { content: string; citations: RagCitation[] };

      const assistantMessage: RagMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        citations: data.citations,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err) {
      console.error('RAG sendMessage error:', err);
      const errorMessage: RagMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  clearConversation: () => set({ messages: [], sidePanelState: null }),

  setSidePanelToRecording: (state) =>
    set({
      sidePanelState: { type: 'recording', ...state },
    }),

  searchAndShowInPanel: async (query: string, collectionIds?: string[]) => {
    set({
      sidePanelState: { type: 'search', query, results: [], isLoading: true },
    });

    try {
      const { selectedCollectionIds } = get();
      const ids = collectionIds ?? (selectedCollectionIds.length ? selectedCollectionIds : undefined);
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, collectionIds: ids, limit: 10 }),
      });

      if (!res.ok) throw new Error(`Search API error: ${res.status}`);

      const data = (await res.json()) as { results: RagSearchResult[] };

      set({
        sidePanelState: { type: 'search', query, results: data.results, isLoading: false },
      });
    } catch (err) {
      console.error('RAG search error:', err);
      set({
        sidePanelState: { type: 'search', query, results: [], isLoading: false },
      });
    }
  },

  closeSidePanel: () => set({ sidePanelState: null }),
}));
