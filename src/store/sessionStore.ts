// ---------------------------------------------------------------------------
// Session store — app-level "where is the learner right now".
//
// The chat screen reads this to know which lesson the learner is currently
// inside so it can build the CoachRequest context. The lesson screen sets it
// when it loads a lesson. It holds only a location reference — the actual
// learning/mastery/weak-area snapshot is always derived by
// LearningContextBuilder from the repositories. No coaching logic lives here.
// ---------------------------------------------------------------------------

import { create } from 'zustand';

type LessonAnchor = {
  id: string;
  title: string;
};

type SessionState = {
  /** The lesson the learner is currently inside, or null. */
  currentLesson: LessonAnchor | null;
  /** Note when the anchor was set so consumers can detect fresh opens. */
  currentLessonSetAt: number;
  setCurrentLesson: (lesson: LessonAnchor | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  currentLesson: null,
  currentLessonSetAt: 0,
  setCurrentLesson: (lesson) =>
    set({ currentLesson: lesson, currentLessonSetAt: Date.now() }),
}));
