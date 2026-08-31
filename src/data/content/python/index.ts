import type { LearningContent } from '../javascript';
import { pythonCourse } from './course';
import { pythonTopics } from './topics';
import {
  pyVariablesLesson,
  pyStringsLesson,
  pyControlFlowLesson,
  pyListsLesson,
  pyDictsLesson,
  pyFunctionsLesson,
  pyOopLesson,
  pyDecoratorsLesson,
  pyAlgorithmsLesson,
} from './lessons';
import { pythonConcepts } from './concepts';
import { pythonProblems } from './problems';
import { pythonChallenges } from './challenges';

export const pythonLearningContent: LearningContent = {
  courses: [pythonCourse],
  topics: pythonTopics,
  lessons: [
    pyVariablesLesson,
    pyStringsLesson,
    pyControlFlowLesson,
    pyListsLesson,
    pyDictsLesson,
    pyFunctionsLesson,
    pyOopLesson,
    pyDecoratorsLesson,
    pyAlgorithmsLesson,
  ],
  concepts: pythonConcepts,
  problems: pythonProblems,
  challenges: pythonChallenges,
};
