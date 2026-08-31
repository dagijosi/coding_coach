// ---------------------------------------------------------------------------
// Content matching (Phase 7 Step 2) — pure, deterministic.
//
// Finds the Coding Coach content (concepts, lessons, problems, challenges)
// that best matches a learner's query. Matching is substring-based on the
// normalized name/summary/title; the best (most direct) match wins. Nothing is
// invented — only content that actually exists in the input is returned.
// ---------------------------------------------------------------------------

import type { Challenge, Concept, Lesson, Problem } from '@/types/learning';

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function toTokens(value: string): string[] {
  return norm(value).split(/[^a-z0-9_-]+/).filter(Boolean);
}

/**
 * Returns concepts whose name and/or summary (normalized) contains every token
 * of the query. A concept matches only when all query tokens are present, so a
 * single common token like "a" cannot match an unrelated concept.
 */
export function matchConcepts(
  concepts: Concept[],
  query: string
): Concept[] {
  const tokens = toTokens(query);
  if (tokens.length === 0) {
    return [];
  }
  return concepts.filter((c) => {
    const haystack = `${norm(c.name)} ${norm(c.summary)}`;
    return tokens.every((t) => haystack.includes(t));
  });
}

/**
 * Returns lessons whose title and/or description (normalized) contains every
 * token of the query.
 */
export function matchLessons(
  lessons: Lesson[],
  query: string
): Lesson[] {
  const tokens = toTokens(query);
  if (tokens.length === 0) {
    return [];
  }
  return lessons.filter(
    (l) =>
      tokens.every((t) => norm(l.title).includes(t)) ||
      tokens.every((t) => norm(l.description).includes(t))
  );
}

/** Returns problems whose title or description matches every query token. */
export function matchProblems(
  problems: Problem[],
  query: string
): Problem[] {
  const tokens = toTokens(query);
  if (tokens.length === 0) {
    return [];
  }
  return problems.filter(
    (p) =>
      tokens.every((t) => norm(p.title).includes(t)) ||
      tokens.every((t) => norm(p.description).includes(t))
  );
}

/** Returns challenges whose title or description matches every query token. */
export function matchChallenges(
  challenges: Challenge[],
  query: string
): Challenge[] {
  const tokens = toTokens(query);
  if (tokens.length === 0) {
    return [];
  }
  return challenges.filter(
    (c) =>
      tokens.every((t) => norm(c.title).includes(t)) ||
      tokens.every((t) => norm(c.description).includes(t))
  );
}

/**
 * The most direct concept match for a definition/explanation request. A
 * concept whose *name* contains every query token is preferred; otherwise the
 * first concept whose summary matches. Returns null when nothing matches.
 */
export function bestConceptFor(
  concepts: Concept[],
  query: string
): Concept | null {
  const tokens = toTokens(query);
  if (tokens.length === 0) {
    return null;
  }
  const direct = concepts.find((c) => {
    const name = norm(c.name);
    return tokens.every((t) => name.includes(t));
  });
  if (direct) {
    return direct;
  }
  return matchConcepts(concepts, query)[0] ?? null;
}

/**
 * Returns the lesson that owns a given concept (by lessonId), when present.
 */
export function lessonForConcept(
  lessons: Lesson[],
  concept: Pick<Concept, 'lessonId'>
): Lesson | null {
  return lessons.find((l) => l.id === concept.lessonId) ?? null;
}
