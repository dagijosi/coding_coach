import { jsLearningContent } from '../src/data/content/javascript/index.ts';
import { CONTENT_VERSION } from '../src/database/contentVersion.ts';

console.log('====================================================');
console.log('CODING COACH — CONTENT VALIDATION');
console.log('====================================================\n');

console.log(`Current Bundled Content Version: ${CONTENT_VERSION}`);
console.log(`Courses:    ${jsLearningContent.courses.length}`);
console.log(`Topics:     ${jsLearningContent.topics.length}`);
console.log(`Lessons:    ${jsLearningContent.lessons.length}`);
console.log(`Concepts:   ${jsLearningContent.concepts.length}`);
console.log(`Problems:   ${jsLearningContent.problems.length}`);
console.log(`Challenges: ${jsLearningContent.challenges.length}\n`);

const errors = [];
const warnings = [];

// 1. Validate Courses & Topics
const courseIds = new Set(jsLearningContent.courses.map((c) => c.id));
const topicIds = new Set(jsLearningContent.topics.map((t) => t.id));

for (const topic of jsLearningContent.topics) {
  if (!courseIds.has(topic.courseId)) {
    errors.push(`Topic "${topic.id}" references unknown courseId "${topic.courseId}"`);
  }
}

// 2. Validate Lessons
const lessonIds = new Set(jsLearningContent.lessons.map((l) => l.id));

for (const lesson of jsLearningContent.lessons) {
  if (!topicIds.has(lesson.topicId)) {
    errors.push(`Lesson "${lesson.id}" references unknown topicId "${lesson.topicId}"`);
  }
}

// 3. Validate Concepts
for (const concept of jsLearningContent.concepts) {
  if (!lessonIds.has(concept.lessonId)) {
    errors.push(`Concept "${concept.id}" references unknown lessonId "${concept.lessonId}"`);
  }
}

// 4. Validate Problems
for (const problem of jsLearningContent.problems) {
  if (!lessonIds.has(problem.lessonId)) {
    errors.push(`Problem "${problem.id}" references unknown lessonId "${problem.lessonId}"`);
  }

  if (problem.choices && problem.answer !== undefined) {
    if (problem.answer < 0 || problem.answer >= problem.choices.length) {
      errors.push(`Problem "${problem.id}" answer index ${problem.answer} is out of bounds (choices length: ${problem.choices.length})`);
    }
  }

  if (!problem.explanation || problem.explanation.trim().length === 0) {
    warnings.push(`Problem "${problem.id}" is missing an explanation.`);
  }
}

// 5. Validate Challenges
for (const challenge of jsLearningContent.challenges) {
  if (!lessonIds.has(challenge.lessonId)) {
    errors.push(`Challenge "${challenge.id}" references unknown lessonId "${challenge.lessonId}"`);
  }

  if (!challenge.functionName) {
    errors.push(`Challenge "${challenge.id}" is missing functionName.`);
  }

  if (!challenge.testCases || challenge.testCases.length === 0) {
    errors.push(`Challenge "${challenge.id}" has 0 test cases.`);
  } else {
    for (const tc of challenge.testCases) {
      if (!tc.id || !Array.isArray(tc.args)) {
        errors.push(`Challenge "${challenge.id}" testCase "${tc.id}" has invalid structure (must have args array and id).`);
      }
    }
  }
}

console.log('----------------------------------------------------');
if (warnings.length > 0) {
  console.log(`⚠️ Warnings (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length > 0) {
  console.error(`\n❌ Validation Failed with ${errors.length} error(s):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('✅ ALL CONTENT VALIDATED SUCCESSFULLY!');
  process.exit(0);
}
