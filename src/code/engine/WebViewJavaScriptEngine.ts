import type {
  ExecuteFunctionOptions,
  JavaScriptEngine,
} from './JavaScriptEngine';

import type { EngineStatus } from './EngineStatus';
import { isWebViewReady, sendTask } from './webview/engineBridge';

import type { EngineResult } from './EngineResult';

const DEFAULT_TIMEOUT_MS = 2000;

export class WebViewJavaScriptEngine
  implements JavaScriptEngine
{
  getStatus(): EngineStatus {
    return isWebViewReady() ? 'available' : 'unavailable';
  }

  async executeFunction(
    options: ExecuteFunctionOptions
  ): Promise<EngineResult> {
    const timeoutMs =
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (!isWebViewReady()) {
      return {
        status: 'error',
        error: 'Execution engine is not ready yet.',
        executionTimeMs: 0,
      };
    }

    return sendTask(
      {
        code: options.code,
        functionName: options.functionName,
        args: options.args,
        language: options.language,
      },
      timeoutMs
    );
  }
}
