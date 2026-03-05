export type RagCitation = {
  id: number;
  quote: string;
  storyUuid: string;
  storyTitle: string;
  speaker: string;
  startTime: number;
  endTime: number;
  collectionName?: string;
};

export type RagSearchResult = {
  storyUuid: string;
  storyTitle: string;
  speaker: string;
  startTime: number;
  endTime: number;
  excerpt: string;
  score: number;
  sectionTitle?: string;
  collectionName?: string;
};
