/**
 * Offline PHP & Laravel Transpiler and Runtime for React Native.
 * Transpiles PHP 8+ / Laravel syntax ($variables, functions, -> method calls, arrays,
 * string concatenation ., fn() arrow functions, Laravel Collection methods) into safe executable JavaScript.
 */

export const PHP_LARAVEL_RUNTIME_HELPERS = `
class __LaravelCollection {
  constructor(items) {
    this.items = Array.isArray(items) ? items : [items];
  }
  all() { return this.items; }
  toArray() { return this.items; }
  count() { return this.items.length; }
  first() { return this.items[0] !== undefined ? this.items[0] : null; }
  last() { return this.items[this.items.length - 1] !== undefined ? this.items[this.items.length - 1] : null; }
  map(callback) {
    return new __LaravelCollection(this.items.map((item, idx) => callback(item, idx)));
  }
  filter(callback) {
    return new __LaravelCollection(this.items.filter((item, idx) => callback ? callback(item, idx) : Boolean(item)));
  }
  pluck(key) {
    return new __LaravelCollection(this.items.map(item => (item && typeof item === "object") ? item[key] : null));
  }
  contains(val) {
    return this.items.includes(val);
  }
  sum(key) {
    return this.items.reduce((acc, item) => acc + (key && typeof item === "object" ? Number(item[key] || 0) : Number(item || 0)), 0);
  }
  avg(key) {
    if (this.items.length === 0) return 0;
    return this.sum(key) / this.items.length;
  }
  values() {
    return new __LaravelCollection(this.items);
  }
}

function collect(items) {
  return new __LaravelCollection(items);
}

function __php_echo() {
  var args = Array.prototype.slice.call(arguments);
  console.log(args.join(" "));
}

function strlen(str) {
  return typeof str === "string" ? str.length : 0;
}

function strtolower(str) {
  return typeof str === "string" ? str.toLowerCase() : "";
}

function strtoupper(str) {
  return typeof str === "string" ? str.toUpperCase() : "";
}

function ucfirst(str) {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function explode(delimiter, str) {
  return typeof str === "string" ? str.split(delimiter) : [];
}

function implode(glue, pieces) {
  return Array.isArray(pieces) ? pieces.join(glue) : "";
}

function in_array(needle, haystack) {
  return Array.isArray(haystack) ? haystack.includes(needle) : false;
}

function count(arr) {
  if (Array.isArray(arr)) return arr.length;
  if (arr && typeof arr === "object") return Object.keys(arr).length;
  return 0;
}

function array_push(arr) {
  var items = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < items.length; i++) arr.push(items[i]);
  return arr.length;
}

function array_merge() {
  var arrays = Array.prototype.slice.call(arguments);
  var res = [];
  for (var i = 0; i < arrays.length; i++) {
    if (Array.isArray(arrays[i])) res = res.concat(arrays[i]);
  }
  return res;
}
`;

/**
 * Transpiles PHP and Laravel code into JavaScript.
 */
export function transpilePhpToJs(phpCode: string): string {
  let code = phpCode.trim();

  // Strip <?php tag if present
  code = code.replace(/^<\?php\s*/i, '');
  code = code.replace(/\?>\s*$/i, '');

  // Strip $ from variable names
  code = code.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1');

  // Replace PHP arrow functions fn(...) => ... with (...) => ...
  code = code.replace(/\bfn\s*\(/g, '(');

  // Replace PHP associative arrays e.g. ['key' => 'val'] -> { 'key': 'val' }
  code = code.replace(/=>/g, ':');

  // Replace PHP string concatenation . with + (BEFORE replacing -> with .)
  code = code.replace(/([a-zA-Z0-9_\)\]\'\"])\s*\.\s*([a-zA-Z0-9_\(\[\'\"])/g, '$1 + $2');

  // Replace -> with . for object/method chaining
  code = code.replace(/->/g, '.');

  // Replace PHP echo with console.log
  code = code.replace(/\becho\s+(.*?);/g, '__php_echo($1);');

  // Replace function keyword if needed
  code = code.replace(/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)(?:\s*:\s*[a-zA-Z0-9_]+)?\s*\{/g, 'function $1($2) {');

  // Replace keywords
  code = code.replace(/\bnull\b/gi, 'null');
  code = code.replace(/\btrue\b/gi, 'true');
  code = code.replace(/\bfalse\b/gi, 'false');

  return code;
}

/**
 * Generates executable JavaScript for PHP / Laravel execution inside WebView bridge.
 */
export function buildPhpRunScript(options: {
  taskId: string;
  code: string;
  functionName: string;
  args: unknown[];
}): string {
  const transpiled = transpilePhpToJs(options.code);
  const payload = JSON.stringify(options);

  return [
    '(() => {',
    '  var payload = ' + payload + ';',
    '  ' + PHP_LARAVEL_RUNTIME_HELPERS,
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
    '    } catch (e) {}',
    '  };',
    '  try {',
    '    var startedAt = Date.now();',
    '    var factory;',
    '    try {',
    '      var jsCode = ' + JSON.stringify(transpiled) + ' + "\\nreturn " + payload.functionName + ";";',
    '      factory = new Function(jsCode);',
    '    } catch (syntaxErr) {',
    '      post({ status: "error", error: "Parse error: " + String((syntaxErr && syntaxErr.message) || syntaxErr), errorType: "syntax", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var fn = factory();',
    '    if (typeof fn !== "function") {',
    '      post({ status: "error", error: "Fatal error: Call to undefined function " + payload.functionName + "()", errorType: "logical", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var value = fn.apply(null, Array.isArray(payload.args) ? payload.args : []);',
    '    if (value && typeof value === "object" && typeof value.toArray === "function") {',
    '      value = value.toArray();',
    '    }',
    '    post({ status: "success", value: value === undefined ? null : value, executionTimeMs: Date.now() - startedAt });',
    '  } catch (e) {',
    '    post({ status: "error", error: "Error: " + String((e && e.message) || e), errorType: "runtime", executionTimeMs: Date.now() });',
    '  }',
    '})();',
    'true;',
  ].join('\n');
}
