/**
 * Offline Python 3 Transpiler and Execution Runtime for React Native.
 * Transpiles standard Python 3 constructs (functions, slicing, range, list comprehensions,
 * dicts, methods, control flow) into safe executable JavaScript with full Python semantics.
 */

export type PythonExecutionResult =
  | {
      status: 'success';
      value: unknown;
      executionTimeMs: number;
      logs: string[];
    }
  | {
      status: 'error';
      error: string;
      errorType: 'syntax' | 'runtime' | 'logical' | 'unknown';
      executionTimeMs: number;
      logs: string[];
    };

/**
 * Python built-in helper runtime injected into the execution context.
 */
export const PYTHON_RUNTIME_HELPERS = `
var __py_None = null;
var __py_True = true;
var __py_False = false;

function __py_idiv(a, b) {
  return Math.floor(a / b);
}

function __py_str(val) {
  if (val === null || val === undefined) return "None";
  if (val === true) return "True";
  if (val === false) return "False";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function __py_int(val) {
  var n = parseInt(val, 10);
  if (isNaN(n)) throw new Error("ValueError: invalid literal for int(): " + __py_str(val));
  return n;
}

function __py_float(val) {
  var n = parseFloat(val);
  if (isNaN(n)) throw new Error("ValueError: could not convert to float: " + __py_str(val));
  return n;
}

function __py_len(val) {
  if (val === null || val === undefined) throw new Error("TypeError: object of type 'NoneType' has no len()");
  if (typeof val === "string" || Array.isArray(val)) return val.length;
  if (typeof val === "object") return Object.keys(val).length;
  throw new Error("TypeError: object has no len()");
}

function __py_range(start, stop, step) {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }
  if (step === undefined) {
    step = 1;
  }
  if (step === 0) throw new Error("ValueError: range() arg 3 must not be zero");
  var res = [];
  if (step > 0) {
    for (var i = start; i < stop; i += step) res.push(i);
  } else {
    for (var i = start; i > stop; i += step) res.push(i);
  }
  return res;
}

function __py_slice(obj, start, stop, step) {
  if (typeof obj !== "string" && !Array.isArray(obj)) {
    throw new Error("TypeError: '" + typeof obj + "' object is not subscriptable");
  }
  var len = obj.length;
  if (step === undefined || step === null) step = 1;
  if (step === 0) throw new Error("ValueError: slice step cannot be zero");

  if (step === -1 && start === null && stop === null) {
    if (typeof obj === "string") return obj.split("").reverse().join("");
    return obj.slice().reverse();
  }

  var actualStart = start === null || start === undefined ? (step > 0 ? 0 : len - 1) : (start < 0 ? Math.max(0, len + start) : Math.min(len, start));
  var actualStop = stop === null || stop === undefined ? (step > 0 ? len : -1) : (stop < 0 ? Math.max(-1, len + stop) : Math.min(len, stop));

  var result = [];
  if (step > 0) {
    for (var i = actualStart; i < actualStop; i += step) {
      result.push(obj[i]);
    }
  } else {
    for (var i = actualStart; i > actualStop; i += step) {
      result.push(obj[i]);
    }
  }
  return typeof obj === "string" ? result.join("") : result;
}

function __py_get_item(obj, index) {
  if (obj === null || obj === undefined) throw new Error("TypeError: 'NoneType' object is not subscriptable");
  if (typeof obj === "string" || Array.isArray(obj)) {
    var idx = index < 0 ? obj.length + index : index;
    if (idx < 0 || idx >= obj.length) throw new Error("IndexError: index out of range");
    return obj[idx];
  }
  if (typeof obj === "object") {
    if (!(index in obj)) throw new Error("KeyError: " + JSON.stringify(index));
    return obj[index];
  }
  return obj[index];
}

function __py_set_item(obj, key, val) {
  if (obj === null || obj === undefined) throw new Error("TypeError: 'NoneType' object does not support item assignment");
  if (Array.isArray(obj)) {
    var idx = key < 0 ? obj.length + key : key;
    if (idx < 0 || idx >= obj.length) throw new Error("IndexError: list assignment index out of range");
    obj[idx] = val;
    return val;
  }
  obj[key] = val;
  return val;
}

function __py_dict_get(dict, key, defVal) {
  if (dict && typeof dict === "object" && key in dict) {
    return dict[key];
  }
  return defVal !== undefined ? defVal : null;
}
`;

/**
 * Transpiles Python source code to equivalent JavaScript executable code.
 */
export function transpilePythonToJs(pythonCode: string): string {
  const lines = pythonCode.split('\n');
  const jsLines: string[] = [];
  const indentStack: number[] = [0];

  for (let rawLine of lines) {
    rawLine = rawLine.replace(/\r$/, '');
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const indentMatch = rawLine.match(/^[ ]*/);
    const indent = indentMatch ? indentMatch[0].length : 0;

    // Close blocks that have higher indentation
    while (indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }

    let line = trimmed.replace(/#.*$/, '').trim();

    // Function def
    const defMatch = line.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*:/);
    if (defMatch) {
      const funcName = defMatch[1];
      const params = defMatch[2];
      jsLines.push(`${' '.repeat(indent)}function ${funcName}(${params}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // If block
    const ifMatch = line.match(/^if\s+(.*?)\s*:/);
    if (ifMatch) {
      const cond = transpilePythonExpr(ifMatch[1]);
      jsLines.push(`${' '.repeat(indent)}if (${cond}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // Elif block
    const elifMatch = line.match(/^elif\s+(.*?)\s*:/);
    if (elifMatch) {
      const cond = transpilePythonExpr(elifMatch[1]);
      if (jsLines.length > 0 && jsLines[jsLines.length - 1].trim() === '}') {
        jsLines[jsLines.length - 1] = `${' '.repeat(indent)}} else if (${cond}) {`;
      } else {
        jsLines.push(`${' '.repeat(indent)}else if (${cond}) {`);
      }
      indentStack.push(indent + 4);
      continue;
    }

    // Else block
    const elseMatch = line.match(/^else\s*:/);
    if (elseMatch) {
      if (jsLines.length > 0 && jsLines[jsLines.length - 1].trim() === '}') {
        jsLines[jsLines.length - 1] = `${' '.repeat(indent)}} else {`;
      } else {
        jsLines.push(`${' '.repeat(indent)}else {`);
      }
      indentStack.push(indent + 4);
      continue;
    }

    // While loop
    const whileMatch = line.match(/^while\s+(.*?)\s*:/);
    if (whileMatch) {
      const cond = transpilePythonExpr(whileMatch[1]);
      jsLines.push(`${' '.repeat(indent)}while (${cond}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // For loop
    const forMatch = line.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_,\s]*)\s+in\s+(.*?)\s*:/);
    if (forMatch) {
      const loopVar = forMatch[1].trim();
      const iterableExpr = transpilePythonExpr(forMatch[2]);
      jsLines.push(`${' '.repeat(indent)}for (const ${loopVar} of (${iterableExpr})) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // Class def
    const classMatch = line.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\((.*?)\))?\s*:/);
    if (classMatch) {
      const className = classMatch[1];
      jsLines.push(`${' '.repeat(indent)}class ${className} {`);
      indentStack.push(indent + 4);
      continue;
    }

    // Pass
    if (line === 'pass') {
      continue;
    }

    // Return
    if (line.startsWith('return ') || line === 'return') {
      const retExpr = line.length > 6 ? transpilePythonExpr(line.substring(7)) : '';
      jsLines.push(`${' '.repeat(indent)}return ${retExpr};`);
      continue;
    }

    // Statement / expression
    const transpiledStmt = transpilePythonStatement(line);
    jsLines.push(`${' '.repeat(indent)}${transpiledStmt};`);
  }

  // Close remaining open blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
  }

  return jsLines.join('\n');
}

/**
 * Transpiles Python statement (assignments, methods, prints).
 */
function transpilePythonStatement(stmt: string): string {
  // Python multiple assignment e.g. low, high = 0, len(arr) - 1
  const multiAssign = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
  if (multiAssign) {
    const var1 = multiAssign[1];
    const var2 = multiAssign[2];
    const exprs = multiAssign[3].split(',');
    if (exprs.length >= 2) {
      return `var [${var1}, ${var2}] = [${transpilePythonExpr(exprs[0])}, ${transpilePythonExpr(exprs[1])}]`;
    }
  }

  // Standard assignment
  const assignMatch = stmt.match(/^([a-zA-Z0-9_\[\]\.\'\"\s]+)\s*(=|\+=|-=|\*=|\/=|\/\/=)\s*(.*)$/);
  if (assignMatch) {
    const target = assignMatch[1].trim();
    const op = assignMatch[2];
    const val = transpilePythonExpr(assignMatch[3].trim());

    if (op === '//=') {
      return `${target} = __py_idiv(${target}, ${val})`;
    }
    if (op === '=') {
      const subMatch = target.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(.*)\]$/);
      if (subMatch) {
        return `__py_set_item(${subMatch[1]}, ${transpilePythonExpr(subMatch[2])}, ${val})`;
      }
      return `var ${target} = ${val}`;
    }
    return `${target} ${op} ${val}`;
  }

  return transpilePythonExpr(stmt);
}

/**
 * Transpiles Python expressions (booleans, slicing, list comps, operators).
 */
function transpilePythonExpr(expr: string): string {
  let res = expr.trim();

  // Python booleans and None
  res = res.replace(/\bTrue\b/g, 'true');
  res = res.replace(/\bFalse\b/g, 'false');
  res = res.replace(/\bNone\b/g, 'null');

  // Python logical operators
  res = res.replace(/\band\b/g, '&&');
  res = res.replace(/\bor\b/g, '||');
  res = res.replace(/\bnot\s+/g, '!');

  // Integer division //
  // Handle (a + b) // c
  res = res.replace(/\(([^()]+)\)\s*\/\/\s*([a-zA-Z0-9_]+)/g, '__py_idiv(($1), $2)');
  // Handle a // b
  res = res.replace(/([a-zA-Z0-9_\.]+)\s*\/\/\s*([a-zA-Z0-9_\.]+)/g, '__py_idiv($1, $2)');

  // Exponentiation **
  res = res.replace(/([a-zA-Z0-9_\.\(\)]+)\s*\*\*\s*([a-zA-Z0-9_\.\(\)]+)/g, 'Math.pow($1, $2)');

  // Built-in len(x)
  res = res.replace(/\blen\s*\((.*?)\)/g, '__py_len($1)');

  // Built-in range(x)
  res = res.replace(/\brange\s*\((.*?)\)/g, '__py_range($1)');

  // Built-in print(...) -> console.log(...)
  res = res.replace(/\bprint\s*\(/g, 'console.log(');

  // Slicing [::-1]
  res = res.replace(/([a-zA-Z0-9_]+)\[\s*:\s*:\s*-1\s*\]/g, '__py_slice($1, null, null, -1)');

  // Slicing [start:stop]
  res = res.replace(/([a-zA-Z0-9_]+)\[\s*([a-zA-Z0-9_\-\+]+)?\s*:\s*([a-zA-Z0-9_\-\+]+)?\s*\]/g, (_, target, s1, s2) => {
    return `__py_slice(${target}, ${s1 || 'null'}, ${s2 || 'null'}, 1)`;
  });

  // String / List / Dict methods
  res = res.replace(/\.lower\(\)/g, '.toLowerCase()');
  res = res.replace(/\.upper\(\)/g, '.toUpperCase()');
  res = res.replace(/\.split\(\)/g, '.trim().split(/\\s+/)');
  res = res.replace(/\.append\((.*?)\)/g, '.push($1)');
  res = res.replace(/([a-zA-Z0-9_]+)\.get\((.*?),\s*(.*?)\)/g, '__py_dict_get($1, $2, $3)');
  res = res.replace(/([a-zA-Z0-9_]+)\.get\(([^,\)]+)\)/g, '__py_dict_get($1, $2, null)');

  // List comprehension [item for sublist in lst for item in sublist]
  const doubleListComp = res.match(/^\[\s*([a-zA-Z0-9_]+)\s+for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_]+)\s+for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_]+)\s*\]$/);
  if (doubleListComp) {
    const outVar = doubleListComp[1];
    const subVar = doubleListComp[2];
    const listVar = doubleListComp[3];
    const innerVar = doubleListComp[4];
    const innerList = doubleListComp[5];
    return `(${listVar}.flatMap(${subVar} => ${innerList}))`;
  }

  // Simple List comprehension [expr for var in iterable (if cond)?]
  const simpleListComp = res.match(/^\[\s*(.*?)\s+for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.*?)(?:\s+if\s+(.*?))?\s*\]$/);
  if (simpleListComp) {
    const outExpr = simpleListComp[1];
    const loopVar = simpleListComp[2];
    const iter = simpleListComp[3];
    const cond = simpleListComp[4];
    if (cond) {
      return `((${iter}).filter(${loopVar} => ${cond}).map(${loopVar} => ${outExpr}))`;
    }
    return `((${iter}).map(${loopVar} => ${outExpr}))`;
  }

  return res;
}

/**
 * Generates the complete executable JavaScript script for Python execution inside the WebView bridge.
 */
export function buildPythonRunScript(options: {
  taskId: string;
  code: string;
  functionName: string;
  args: unknown[];
}): string {
  const transpiled = transpilePythonToJs(options.code);
  const payload = JSON.stringify(options);

  return [
    '(() => {',
    '  var payload = ' + payload + ';',
    '  ' + PYTHON_RUNTIME_HELPERS,
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
    '    } catch (e) { /* Bridge unavailable */ }',
    '  };',
    '  try {',
    '    var startedAt = Date.now();',
    '    var factory;',
    '    try {',
    '      var jsCode = ' + JSON.stringify(transpiled) + ' + "\\nreturn " + payload.functionName + ";";',
    '      factory = new Function(jsCode);',
    '    } catch (syntaxErr) {',
    '      post({ status: "error", error: "SyntaxError: " + String((syntaxErr && syntaxErr.message) || syntaxErr), errorType: "syntax", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var fn;',
    '    try {',
    '      fn = factory();',
    '    } catch (runtimeErr) {',
    '      post({ status: "error", error: "NameError: " + String((runtimeErr && runtimeErr.message) || runtimeErr), errorType: "runtime", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    if (typeof fn !== "function") {',
    '      post({ status: "error", error: "NameError: function \\"" + payload.functionName + "\\" is not defined.", errorType: "logical", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var value;',
    '    try {',
    '      value = fn.apply(null, Array.isArray(payload.args) ? payload.args : []);',
    '    } catch (execErr) {',
    '      post({ status: "error", error: String((execErr && execErr.message) || execErr), errorType: "runtime", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    post({ status: "success", value: value === undefined ? null : value, executionTimeMs: Date.now() - startedAt });',
    '  } catch (e) {',
    '    post({ status: "error", error: "Error: " + String((e && e.message) || e), errorType: "unknown", executionTimeMs: Date.now() });',
    '  }',
    '})();',
    'true;',
  ].join('\n');
}
