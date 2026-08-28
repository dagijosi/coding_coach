import type {
  CodeExecutionResult,
  SupportedLanguage,
} from './types';

export interface CodeRunner {
  run(
    code: string,
    language: SupportedLanguage
  ): Promise<CodeExecutionResult>;
}
