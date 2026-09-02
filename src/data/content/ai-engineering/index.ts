import type { LearningContent } from '../javascript';
import { aiEngineeringCourse } from './course';
import { aiEngineeringTopics } from './topics';
import {
  llmApisLesson,
  structuredOutputsLesson,
  promptContextLesson,
  toolCallingLesson,
  reactAgentLesson,
  multiAgentLesson,
  embeddingsLesson,
  ragPipelineLesson,
  advancedRagLesson,
  evalsGuardrailsLesson,
  aiSecurityCostLesson,
  caseStudyLesson,
} from './lessons';
import { aiEngineeringConcepts } from './concepts';
import { aiEngineeringProblems } from './problems';
import { aiEngineeringChallenges } from './challenges';

export const aiEngineeringLearningContent: LearningContent = {
  courses: [aiEngineeringCourse],
  topics: aiEngineeringTopics,
  lessons: [
    llmApisLesson,
    structuredOutputsLesson,
    promptContextLesson,
    toolCallingLesson,
    reactAgentLesson,
    multiAgentLesson,
    embeddingsLesson,
    ragPipelineLesson,
    advancedRagLesson,
    evalsGuardrailsLesson,
    aiSecurityCostLesson,
    caseStudyLesson,
  ],
  concepts: aiEngineeringConcepts,
  problems: aiEngineeringProblems,
  challenges: aiEngineeringChallenges,
};
