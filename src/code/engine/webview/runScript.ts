import { buildPythonRunScript } from '../python/pythonRuntime';
import { buildPhpRunScript } from '../php/phpRuntime';
import { buildReactRunScript } from '../react/reactRuntime';
import {
  detectLanguageFromCode,
  normalizeLanguageId,
  type LanguageId,
} from '../../languages/languageRegistry';

export type StudentCodeTask = {
  taskId: string;
  code: string;
  functionName: string;
  args: unknown[];
  language?: string;
};

export type StudentCodeResult =
  | {
      status: 'success';
      value: unknown;
      executionTimeMs: number;
      logs?: string[];
    }
  | {
      status: 'error';
      error: string;
      errorType: 'syntax' | 'runtime' | 'logical' | 'unknown';
      executionTimeMs: number;
      logs?: string[];
    };

function normalizeValue(value: unknown): unknown {
  switch (typeof value) {
    case 'bigint':
      return value.toString();
    case 'object':
      if (value === null || value === undefined) {
        return value;
      }
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return String(value);
      }
    case 'symbol':
      return String(value);
    default:
      return value;
  }
}

const NORMALIZE_JS = `var normalizeValue = function (value) {
  var t = typeof value;
  if (t === 'bigint') { return value.toString(); }
  if (t === 'object') {
    if (value === null || value === undefined) { return value; }
    try { return JSON.parse(JSON.stringify(value)); }
    catch (e) { return String(value); }
  }
  if (t === 'symbol') { return String(value); }
  return value;
};`;

export function buildRunScript(task: StudentCodeTask): string {
  // Determine language (from explicit prop or heuristic detection)
  const langId: LanguageId = task.language
    ? normalizeLanguageId(task.language)
    : detectLanguageFromCode(task.code);

  if (langId === 'python') {
    return buildPythonRunScript({
      taskId: task.taskId,
      code: task.code,
      functionName: task.functionName,
      args: task.args,
    });
  }

  if (langId === 'php' || langId === 'laravel') {
    return buildPhpRunScript({
      taskId: task.taskId,
      code: task.code,
      functionName: task.functionName,
      args: task.args,
    });
  }

  if (langId === 'react') {
    return buildReactRunScript({
      taskId: task.taskId,
      code: task.code,
      functionName: task.functionName,
      args: task.args,
    });
  }

  // Default: JavaScript / TypeScript execution builder
  const payload = JSON.stringify(task);
  return [
    '(() => {',
    '  var payload = ' + payload + ';',
    '  ' + NORMALIZE_JS,
    '  var bridge = window.ReactNativeWebView;',
    '  var capturedLogs = [];',
    '  var oldLog = console.log;',
    '  console.log = function () {',
    '    try {',
    '      var args = Array.prototype.slice.call(arguments);',
    '      capturedLogs.push(args.map(function (a) { return typeof a === "object" ? JSON.stringify(a) : String(a); }).join(" "));',
    '    } catch (e) {}',
    '    if (oldLog) { oldLog.apply(console, arguments); }',
    '  };',
    '  var post = function (result) {',
    '    try {',
    '      result.logs = capturedLogs;',
    '      bridge.postMessage(JSON.stringify({ taskId: payload.taskId, result: result }));',
    '    } catch (e) { /* If the native bridge is unavailable there is nowhere to report. */ }',
    '  };',
    '  var reportError = function (tag, msg, errorType) {',
    '    post({ status: "error", error: String(msg) + " [" + tag + "]", errorType: errorType, executionTimeMs: Date.now(), });',
    '  };',
    '  try {',
    '    var startedAt = Date.now();',
    '    var factory;',
    '    try {',
    '      factory = new Function(payload.code + "\\nreturn " + payload.functionName + ";");',
    '    } catch (e) {',
    '      post({ status: "error", error: String((e && e.message) || e), errorType: "syntax", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var fn;',
    '    try {',
    '      fn = factory();',
    '    } catch (e) {',
    '      post({ status: "error", error: String((e && e.message) || e), errorType: "runtime", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    if (typeof fn !== "function") {',
    '      post({ status: "error", error: "\\"" + payload.functionName + "\\" is not a function.", errorType: "logical", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var value;',
    '    try {',
    '      value = fn.apply(null, Array.isArray(payload.args) ? payload.args : []);',
    '    } catch (e) {',
    '      post({ status: "error", error: String((e && e.message) || e), errorType: "runtime", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    post({ status: "success", value: normalizeValue(value), executionTimeMs: Date.now() - startedAt });',
    '  } catch (e) {',
    '    reportError("unexpected", (e && e.message) || e, "unknown");',
    '  }',
    '})();',
    'true;',
  ].join('\n');
}
