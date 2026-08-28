import { router } from 'expo-router';

import type { Problem } from '@/types/problem';
import type { Challenge } from '@/types/learning';

export function openProblem(problem: Problem): void {
  router.push(`/problem/${problem.id}`);
}

export function openChallenge(challenge: Challenge): void {
  router.push(`/challenge/${challenge.id}`);
}

export function openChallengeById(challengeId: string): void {
  router.push(`/challenge/${challengeId}`);
}
