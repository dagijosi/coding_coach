import type { LearningContent } from '../javascript';
import { frontendCourse } from './course';
import { frontendTopics } from './topics';
import {
  componentsLesson,
  propsLesson,
  stateLesson,
  renderingReconciliationLesson,
  memoizationLesson,
  concurrentRenderingLesson,
  serverComponentsLesson,
  performanceProfilingLesson,
  suspenseLesson,
  tanstackQueryLesson,
  cachingStrategiesLesson,
  optimisticUpdatesLesson,
  genericsReactLesson,
  conditionalTypesLesson,
  mappedTypesLesson,
  typeSafeApisLesson,
  stateArchitectureLesson,
  advancedHooksLesson,
  accessibilityLesson,
  frontendArchitectureLesson,
} from './lessons';
import { frontendConcepts } from './concepts';
import { frontendProblems } from './problems';
import { frontendChallenges } from './challenges';

export const frontendLearningContent: LearningContent = {
  courses: [frontendCourse],
  topics: frontendTopics,
  lessons: [
    componentsLesson,
    propsLesson,
    stateLesson,
    renderingReconciliationLesson,
    memoizationLesson,
    concurrentRenderingLesson,
    serverComponentsLesson,
    performanceProfilingLesson,
    suspenseLesson,
    tanstackQueryLesson,
    cachingStrategiesLesson,
    optimisticUpdatesLesson,
    genericsReactLesson,
    conditionalTypesLesson,
    mappedTypesLesson,
    typeSafeApisLesson,
    stateArchitectureLesson,
    advancedHooksLesson,
    accessibilityLesson,
    frontendArchitectureLesson,
  ],
  concepts: frontendConcepts,
  problems: frontendProblems,
  challenges: frontendChallenges,
};
