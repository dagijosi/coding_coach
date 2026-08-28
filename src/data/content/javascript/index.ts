import type {
  Challenge,
  Concept,
  Course,
  Lesson,
  Problem,
  Topic,
} from '@/types/learning';

import { jsCourse } from './course';
import { jsTopics } from './topics/fundamentals';
import { variablesLesson, functionsLesson } from './lessons';
import { variablesConcepts, functionsConcepts } from './concepts';
import { variablesProblems, functionsProblems } from './problems';
import {
  variablesChallenges,
  functionsChallenges,
} from './challenges';

export type LearningContent = {
  courses: Course[];
  topics: Topic[];
  lessons: Lesson[];
  concepts: Concept[];
  problems: Problem[];
  challenges: Challenge[];
};

export const jsLearningContent: LearningContent = {
  courses: [jsCourse],
  topics: jsTopics,
  lessons: [variablesLesson, functionsLesson],
  concepts: [...variablesConcepts, ...functionsConcepts],
  problems: [...variablesProblems, ...functionsProblems],
  challenges: [...variablesChallenges, ...functionsChallenges],
};
