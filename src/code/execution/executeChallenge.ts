import {
  getJavaScriptEngine,
} from '../engine';

import type {
  CodeTestCase,
  CodeTestResult,
  CodeChallengeResult,
} from '../types';

export async function executeChallenge(
  code: string,
  functionName: string,
  tests: CodeTestCase[],
  language?: string
): Promise<CodeChallengeResult> {
  const engine = getJavaScriptEngine();

  const results: CodeTestResult[] = [];

  for (const test of tests) {
    const result = await engine.executeFunction({
      code,
      functionName,
      args: test.args,
      language,
      timeoutMs: 2000,
    });

    const passed =
      result.status === 'success' &&
      valuesEqual(
        result.value,
        test.expected
      );

    results.push({
      testCaseId: test.id,
      passed,
      actualValue:
        result.status === 'success'
          ? result.value
          : undefined,
      expectedValue: test.expected,
      error:
        result.status === 'error'
          ? result.error
          : undefined,
      executionTimeMs: result.executionTimeMs,
    });
  }

  const testsPassed = results.filter(
    (result) => result.passed
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
