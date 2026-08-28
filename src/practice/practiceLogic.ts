import type {
  Challenge,
  Lesson,
  Topic,
} from '@/types/learning';

export type ChallengeStatus = 'solved' | 'attempted' | 'untouched';

export type PracticeChallenge = {
  challenge: Challenge;
  topicId: string;
  topicName: string;
  lessonTitle: string;
};

export type TopicGroup = {
  topicId: string;
  topicName: string;
  challenges: PracticeChallenge[];
};

export type PracticeIndex = {
  ordered: PracticeChallenge[];
  byId: Map<string, PracticeChallenge>;
  topicGroups: TopicGroup[];
};

/**
 * Builds a single index of challenges enriched with their place in the
 * content hierarchy (topic + lesson) and ordered deterministically by
 * topic order -> lesson order -> challenge order.
 */
export function buildPracticeIndex(
  challenges: Challenge[],
  lessons: Lesson[],
  topics: Topic[]
): PracticeIndex {
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const withMeta: PracticeChallenge[] = challenges.map((c) => {
    const lesson = lessonById.get(c.lessonId);
    const topic = topicById.get(lesson?.topicId ?? '');

    return {
      challenge: c,
      topicId: topic?.id ?? '',
      topicName: topic?.name ?? 'General',
      lessonTitle: lesson?.title ?? 'Unknown lesson',
    };
  });

  const order = (item: PracticeChallenge): number[] => {
    const lesson = lessonById.get(item.challenge.lessonId);
    const topic = topicById.get(lesson?.topicId ?? '');
    return [topic?.order ?? 999, lesson?.order ?? 999, item.challenge.order];
  };

  const cmp = (a: PracticeChallenge, b: PracticeChallenge): number => {
    const ao = order(a);
    const bo = order(b);
    for (let i = 0; i < ao.length; i++) {
      if (ao[i] !== bo[i]) return ao[i] - bo[i];
    }
    return a.challenge.id.localeCompare(b.challenge.id);
  };

  withMeta.sort(cmp);

  const byId = new Map(withMeta.map((item) => [item.challenge.id, item]));

  const topicGroups: TopicGroup[] = [];
  for (const item of withMeta) {
    const group = topicGroups.find((g) => g.topicId === item.topicId);
    if (group) {
      group.challenges.push(item);
    } else {
      topicGroups.push({
        topicId: item.topicId,
        topicName: item.topicName,
        challenges: [item],
      });
    }
  }

  return { ordered: withMeta, byId, topicGroups };
}

export function getChallengeStatus(
  challengeId: string,
  completedIds: ReadonlySet<string>,
  attemptedIds: ReadonlySet<string>
): ChallengeStatus {
  if (completedIds.has(challengeId)) return 'solved';
  if (attemptedIds.has(challengeId)) return 'attempted';
  return 'untouched';
}

/**
 * Chooses the challenge a learner should resume for "Continue practicing".
 *
 * Prefers the most recently attempted challenge so they can pick up where they
 * left off. Falls back to the first incomplete challenge in hierarchy order,
 * then the very first challenge. Returns null only when there is no content.
 */
export function selectResumeChallenge(
  index: PracticeIndex,
  completedIds: ReadonlySet<string>,
  attemptedIds: ReadonlySet<string>,
  mostRecentAttemptedId: string | null
): string | null {
  const { ordered } = index;
  if (ordered.length === 0) return null;

  if (mostRecentAttemptedId && index.byId.has(mostRecentAttemptedId)) {
    return mostRecentAttemptedId;
  }

  if (attemptedIds.size > 0) {
    for (const item of ordered) {
      if (attemptedIds.has(item.challenge.id)) {
        return item.challenge.id;
      }
    }
  }

  const firstIncomplete = ordered.find(
    (item) => !completedIds.has(item.challenge.id)
  );
  if (firstIncomplete) return firstIncomplete.challenge.id;

  return ordered[0].challenge.id;
}

/**
 * Deterministic "next practice" after solving `currentId`.
 *
 * Prefers another incomplete challenge in the same topic, otherwise the next
 * incomplete challenge in hierarchy order, wrapping around. Returns null only
 * when every challenge has been completed.
 */
export function selectNextChallenge(
  index: PracticeIndex,
  completedIds: ReadonlySet<string>,
  currentId: string
): string | null {
  const { ordered } = index;
  if (ordered.length === 0) return null;

  const current = index.byId.get(currentId);

  const incomplete = ordered.filter(
    (item) => !completedIds.has(item.challenge.id)
  );
  if (incomplete.length === 0) return null;

  if (current) {
    const sameTopic = incomplete.find(
      (item) =>
        item.topicId === current.topicId &&
        item.challenge.id !== currentId
    );
    if (sameTopic) return sameTopic.challenge.id;

    const nextAfter = incomplete.find(
      (item) =>
        ordered.indexOf(item) > ordered.indexOf(current)
    );
    if (nextAfter) return nextAfter.challenge.id;
  }

  return incomplete[0].challenge.id;
}
