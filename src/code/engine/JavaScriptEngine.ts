import type { EngineResult } from './EngineResult';
import type { EngineStatus } from './EngineStatus';

export type ExecuteFunctionOptions = {
  code: string;
  functionName: string;
  args: unknown[];
  timeoutMs?: number;
};

export interface JavaScriptEngine {
  getStatus(): EngineStatus;

  executeFunction(
    options: ExecuteFunctionOptions
  ): Promise<EngineResult>;
}
