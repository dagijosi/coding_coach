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
import {
  variablesLesson,
  functionsLesson,
  dataTypesLesson,
  controlFlowLesson,
  scopeLesson,
  arraysLesson,
  objectsLesson,
  asyncLesson,
  classesLesson,
  errorHandlingLesson,
  algorithmsLesson,
} from './lessons';
import {
  variablesConcepts,
  functionsConcepts,
  dataTypesConcepts,
  controlFlowConcepts,
  scopeConcepts,
  arraysConcepts,
  objectsConcepts,
  asyncConcepts,
  classesConcepts,
  errorHandlingConcepts,
  algorithmsConcepts,
} from './concepts';
import {
  variablesProblems,
  functionsProblems,
  dataTypesProblems,
  controlFlowProblems,
  scopeProblems,
  arraysProblems,
  objectsProblems,
  asyncProblems,
  classesProblems,
  errorHandlingProblems,
  algorithmsProblems,
} from './problems';
import {
  variablesChallenges,
  functionsChallenges,
  extendedChallenges,
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
  lessons: [
    variablesLesson,
    functionsLesson,
    dataTypesLesson,
    controlFlowLesson,
    scopeLesson,
    arraysLesson,
    objectsLesson,
    asyncLesson,
    classesLesson,
    errorHandlingLesson,
    algorithmsLesson,
  ],
  concepts: [
    ...variablesConcepts,
    ...functionsConcepts,
    ...dataTypesConcepts,
    ...controlFlowConcepts,
    ...scopeConcepts,
    ...arraysConcepts,
    ...objectsConcepts,
    ...asyncConcepts,
    ...classesConcepts,
    ...errorHandlingConcepts,
    ...algorithmsConcepts,
  ],
  problems: [
    ...variablesProblems,
    ...functionsProblems,
    ...dataTypesProblems,
    ...controlFlowProblems,
    ...scopeProblems,
    ...arraysProblems,
    ...objectsProblems,
    ...asyncProblems,
    ...classesProblems,
    ...errorHandlingProblems,
    ...algorithmsProblems,
  ],
  challenges: [
    ...variablesChallenges,
    ...functionsChallenges,
    ...extendedChallenges,
  ],
};
