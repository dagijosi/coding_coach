import type { LearningContent } from '../javascript';
import { typescriptCourse } from './course';
import { typescriptTopics } from './topics';
import {
  tsBasicTypesLesson,
  tsInterfacesLesson,
  tsFunctionsLesson,
  tsUnionLesson,
  tsGenericsLesson,
  tsUtilityTypesLesson,
  tsClassesLesson,
  tsAdvancedTypesLesson,
  tsDesignPatternsLesson,
} from './lessons';
import { typescriptConcepts } from './concepts';
import { typescriptProblems } from './problems';
import { typescriptChallenges } from './challenges';

export const typescriptLearningContent: LearningContent = {
  courses: [typescriptCourse],
  topics: typescriptTopics,
  lessons: [
    tsBasicTypesLesson,
    tsInterfacesLesson,
    tsFunctionsLesson,
    tsUnionLesson,
    tsGenericsLesson,
    tsUtilityTypesLesson,
    tsClassesLesson,
    tsAdvancedTypesLesson,
    tsDesignPatternsLesson,
  ],
  concepts: typescriptConcepts,
  problems: typescriptProblems,
  challenges: typescriptChallenges,
};
