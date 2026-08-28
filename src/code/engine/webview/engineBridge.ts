import type { WebView } from 'react-native-webview';

import type { EngineResult } from '../EngineResult';
import type { StudentCodeResult } from './runScript';
import { buildRunScript } from './runScript';

type PendingTask = {
  resolve: (result: StudentCodeResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

let webViewRef: WebView | null = null;
let webViewLoaded = false;
let bridgeAlive = false;
let taskCounter = 0;

const pending = new Map<string, PendingTask>();

export function registerWebView(ref: WebView | null): void {
  webViewRef = ref;
  if (!ref) {
    webViewLoaded = false;
    bridgeAlive = false;
    rejectAll('WebView was torn down.');
    pending.clear();
  }
}

export function markWebViewLoaded(loaded: boolean): void {
  webViewLoaded = loaded;
}

export function isWebViewReady(): boolean {
  return Boolean(webViewRef && webViewLoaded);
}

export function handleBridgeMessage(data: string): void {
  let message: {
    type?: string;
    taskId?: string;
    result?: StudentCodeResult;
  } | null = null;

  try {
    message = JSON.parse(data);
  } catch {
    return;
  }

  if (!message) {
    return;
  }

  if (message.type === 'ready') {
    bridgeAlive = true;
    return;
  }

  if (typeof message.taskId !== 'string') {
    return;
  }

  const task = pending.get(message.taskId);

  if (!task) {
    return;
  }

  clearTimeout(task.timer);
  pending.delete(message.taskId);

  if (message.result) {
    task.resolve(message.result);
  } else {
    task.reject(
      new Error('Runtime returned an empty response.')
    );
  }
}

export async function sendTask(
  task: {
    code: string;
    functionName: string;
    args: unknown[];
  },
  timeoutMs: number
): Promise<EngineResult> {
  if (!isWebViewReady()) {
    return {
      status: 'error',
      error: 'Execution engine is not ready yet.',
      executionTimeMs: 0,
    };
  }

  const taskId = `task-${Date.now()}-${taskCounter++}`;

  const result = await new Promise<StudentCodeResult>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(taskId);
        const error = new Error(
          bridgeAlive
            ? `Execution timed out after ${timeoutMs} ms.`
            : 'Execution engine bridge is not responding (WebView did not signal ready).'
        );
        error.name = 'TimeoutError';
        reject(error);
      }, timeoutMs);

      pending.set(taskId, { resolve, reject, timer });

      const script = buildRunScript({
        taskId,
        code: task.code,
        functionName: task.functionName,
        args: task.args,
      });

      try {
        webViewRef!.injectJavaScript(script);
      } catch (error) {
        clearTimeout(timer);
        pending.delete(taskId);
        reject(
          error instanceof Error
            ? error
            : new Error(String(error))
        );
      }
    }
  );

  if (result.status === 'success') {
    return {
      status: 'success',
      value: result.value,
      executionTimeMs: result.executionTimeMs,
    };
  }

  return {
    status: 'error',
    error: result.error,
    executionTimeMs: result.executionTimeMs,
  };
}

function rejectAll(errorMessage: string): void {
  const error = new Error(errorMessage);

  pending.forEach((task) => {
    clearTimeout(task.timer);
    task.reject(error);
  });
}
