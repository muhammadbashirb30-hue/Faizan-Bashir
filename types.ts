export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface Event {
  name: string;
  description: string;
  date: string;
  country: string;
}

export interface ContentIdea {
  title: string;
  description: string;
  keywords: string[];
}

export interface AIContent {
  ideas: ContentIdea[];
  uploadTip: string;
}

export interface TrendingIdea {
  title: string;
  description: string;
  keywords: string[];
}

export interface AITrendReport {
  ideas: TrendingIdea[];
  audienceTip: string;
}


export enum ContentType {
  PHOTO = "Photo",
  VECTOR = "Vector",
  VIDEO = "Video",
  ILLUSTRATION = "Illustration",
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface HotTopic {
  topic: string;
  reason: string;
}

export interface KeywordStrategy {
  primaryKeywords: string[];
  longTailKeywords: string[];
  relatedConcepts: string[];
}
