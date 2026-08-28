import { router } from 'expo-router';

import type { Problem } from '@/types/problem';

export function openProblem(problem: Problem): void {
  router.push(`/problem/${problem.id}`);
}
