export type SupportedLanguage =
  | 'javascript'
  | 'typescript';

export type CodeExecutionStatus =
  | 'success'
  | 'error'
  | 'timeout';

export type CodeExecutionResult = {
  status: CodeExecutionStatus;
  value?: unknown;
  output?: string;
  error?: string;
  executionTimeMs: number;
};

export type CodeTestCase = {
  id: string;
  args: unknown[];
  expected: unknown;
};

export type CodeTestResult = {
  testCaseId: string;
  passed: boolean;
  actualValue?: unknown;
  expectedValue: unknown;
  error?: string;
  executionTimeMs: number;
};

export type CodeChallengeResult = {
  passed: boolean;
  testsPassed: number;
  testsTotal: number;
  tests: CodeTestResult[];
};
