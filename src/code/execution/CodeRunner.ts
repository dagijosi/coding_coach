import {
  getJavaScriptEngine,
} from '../engine';

import type {
  CodeChallengeResult,
  CodeTestResult,
} from '../types';

export class CodeRunner {
  async runChallenge(
    code: string,
    functionName: string,
    tests: {
      id: string;
      args: unknown[];
      expected: unknown;
    }[]
  ): Promise<CodeChallengeResult> {
    const engine = getJavaScriptEngine();

    const results: CodeTestResult[] = [];

    for (const test of tests) {
      const result = await engine.executeFunction({
        code,
        functionName,
        args: test.args,
        timeoutMs: 2000,
      });

      const passed =
        result.status === 'success' &&
        JSON.stringify(result.value) ===
          JSON.stringify(test.expected);

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
        executionTimeMs:
          result.executionTimeMs,
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
}
