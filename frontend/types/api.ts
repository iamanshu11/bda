/** Shapes returned by the backend content APIs (subset used by public pages). */

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconKey?: string | null;
}

export interface ApiCourse {
  id: string;
  title: string;
  slug: string;
  badge?: string | null;
  badgeType?: 'FOUNDATION' | 'GUARANTEE';
  shortDesc?: string | null;
  description?: string | null;
  bannerUrl?: string | null;
  curriculum?: unknown;
  durationWeeks?: number | null;
  fees?: string | number | null;
  category?: ApiCategory | null;
  faculties?: ApiFaculty[];
  faqs?: ApiFaq[];
  demoVideos?: { id: string; title: string; url: string }[];
  previewModules?: ApiPreviewModule[];
  rating?: { average: number; count: number };
}

export interface ApiPreviewModule {
  id: string;
  moduleNumber: number;
  title: string;
  description?: string | null;
  youtubeUrl?: string | null;
  youtubeIframe?: string | null;
  notes?: string | null;
  estimatedDuration?: string | null;
  quiz?: {
    passingMarks: number;
    questions: { id: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string }[];
  } | null;
}

export interface ApiReview {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  author: string;
  createdAt: string;
}

export interface ApiFaculty {
  id: string;
  name: string;
  slug: string;
  designation?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  expertise?: string[];
}

export interface ApiFaq {
  id: string;
  question: string;
  answer: string;
}

export interface ApiGalleryItem {
  id: string;
  title?: string | null;
  imageUrl: string;
  category?: string | null;
}

export interface ApiResult {
  id: string;
  studentName: string;
  rank: string;
  exam: string;
  year?: number | null;
  photoUrl?: string | null;
}

export interface ApiHallOfFame {
  id: string;
  name: string;
  rank: string;
  exam: string;
  photoUrl?: string | null;
}
