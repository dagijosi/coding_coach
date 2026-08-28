import type {
  ExecuteFunctionOptions,
  JavaScriptEngine,
} from './JavaScriptEngine';

import type { EngineResult } from './EngineResult';
import type { EngineStatus } from './EngineStatus';

export class UnavailableJavaScriptEngine
  implements JavaScriptEngine
{
  getStatus(): EngineStatus {
    return 'unavailable';
  }

  async executeFunction(
    _options: ExecuteFunctionOptions
  ): Promise<EngineResult> {
    return {
      status: 'error',
      error:
        'JavaScript execution engine is not available.',
      executionTimeMs: 0,
    };
  }
}
