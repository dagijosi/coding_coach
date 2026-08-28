import type { CodeRunner } from './CodeRunner';
import type {
  CodeTestCase,
  CodeTestResult,
  CodeChallengeResult,
} from './types';

export async function runTests(
  runner: CodeRunner,
  code: string,
  tests: CodeTestCase[]
): Promise<CodeChallengeResult> {
  const results: CodeTestResult[] = [];

  for (const test of tests) {
    const result = await runner.run(
      code,
      'javascript'
    );

    const passed =
      result.status === 'success' &&
      valuesEqual(
        result.value,
        test.expected
      );

    results.push({
      testCaseId: test.id,
      passed,
      actualValue: result.value,
      expectedValue: test.expected,
      error: result.error,
      executionTimeMs: result.executionTimeMs,
    });
  }

  const testsPassed = results.filter(
    (test) => test.passed
  ).length;

  return {
    passed: testsPassed === tests.length,
    testsPassed,
    testsTotal: tests.length,
    tests: results,
  };
}

function valuesEqual(
  actual: unknown,
  expected: unknown
): boolean {
  return JSON.stringify(actual) ===
    JSON.stringify(expected);
}
