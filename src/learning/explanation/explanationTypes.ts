// ---------------------------------------------------------------------------
// Explanation engine — type model (Phase 7 Step 4).
// ---------------------------------------------------------------------------

import type { SuggestedAction } from '@/learning/coach/coachTypes';

/** Minimal concept reference the explanation engine works with. */
export type ConceptRef = {
  id: string;
  name: string;
  summary: string;
};

/** Minimal lesson reference the explanation engine works with. */
export type LessonRef = {
  id: string;
  topicId: string;
  title: string;
  description: string;
  content: Array<{ type: string; content: string }>;
};

/** Minimal problem reference the explanation engine works with. */
export type ProblemRef = {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  type: string;
  prompt?: string;
  explanation: string;
};

/** Teaching-section layout for a concept explanation. */
export type ConceptSections = {
  whatItIs: string | null;
  whyItMatters: string | null;
  simpleExample: string | null;
  commonMistake: string | null;
  relatedPractice: { id: string; title: string } | null;
};

export type ExplanationResult = {
  message: string;
  actions: SuggestedAction[];
};
