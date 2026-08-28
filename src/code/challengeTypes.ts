import type {
  CodeTestCase,
  SupportedLanguage,
} from './types';

export type CodeChallenge = {
  id: string;

  title: string;
  description: string;

  language: SupportedLanguage;

  starterCode: string;

  functionName: string;

  tests: CodeTestCase[];

  hints: string[];

  explanation: string;
};
