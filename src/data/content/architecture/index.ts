import type { LearningContent } from '../javascript';
import { architectureCourse } from './course';
import { architectureTopics } from './topics';
import {
  sixLayersLesson,
  separationOfConcernsLesson,
  repositoryPatternLesson,
  solidPrinciplesLesson,
  dependencyInjectionLesson,
  dddEssentialsLesson,
  creationalStructuralLesson,
  behavioralPatternsLesson,
  apiBoundariesLesson,
  overengineeringLesson,
  featureVsLayerLesson,
  systemEvolutionLesson,
} from './lessons';
import { architectureConcepts } from './concepts';
import { architectureProblems } from './problems';
import { architectureChallenges } from './challenges';

export const architectureLearningContent: LearningContent = {
  courses: [architectureCourse],
  topics: architectureTopics,
  lessons: [
    sixLayersLesson,
    separationOfConcernsLesson,
    repositoryPatternLesson,
    solidPrinciplesLesson,
    dependencyInjectionLesson,
    dddEssentialsLesson,
    creationalStructuralLesson,
    behavioralPatternsLesson,
    apiBoundariesLesson,
    overengineeringLesson,
    featureVsLayerLesson,
    systemEvolutionLesson,
  ],
  concepts: architectureConcepts,
  problems: architectureProblems,
  challenges: architectureChallenges,
};
