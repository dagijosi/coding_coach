/**
 * Offline Python 3 Transpiler and Runtime Smoke Test
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

export function transpilePythonToJs(pythonCode) {
  const lines = pythonCode.split('\n');
  const jsLines = [];
  const indentStack = [0];

  for (let rawLine of lines) {
    rawLine = rawLine.replace(/\r$/, '');
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const indentMatch = rawLine.match(/^[ ]*/);
    const indent = indentMatch ? indentMatch[0].length : 0;

    while (indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }

    let line = trimmed.replace(/#.*$/, '').trim();

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

    const whileMatch = line.match(/^while\s+(.*?)\s*:/);
    if (whileMatch) {
      const cond = transpilePythonExpr(whileMatch[1]);
      jsLines.push(`${' '.repeat(indent)}while (${cond}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    const forMatch = line.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_,\s]*)\s+in\s+(.*?)\s*:/);
    if (forMatch) {
      const loopVar = forMatch[1].trim();
      const iterableExpr = transpilePythonExpr(forMatch[2]);
      jsLines.push(`${' '.repeat(indent)}for (const ${loopVar} of (${iterableExpr})) {`);
      indentStack.push(indent + 4);
      continue;
    }

    if (line === 'pass') {
      continue;
    }

    if (line.startsWith('return ') || line === 'return') {
      const retExpr = line.length > 6 ? transpilePythonExpr(line.substring(7)) : '';
      jsLines.push(`${' '.repeat(indent)}return ${retExpr};`);
      continue;
    }

    const transpiledStmt = transpilePythonStatement(line);
    jsLines.push(`${' '.repeat(indent)}${transpiledStmt};`);
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
  }

  return jsLines.join('\n');
}

function transpilePythonStatement(stmt) {
  const multiAssign = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
  if (multiAssign) {
    const var1 = multiAssign[1];
    const var2 = multiAssign[2];
    const exprs = multiAssign[3].split(',');
    if (exprs.length >= 2) {
      return `var [${var1}, ${var2}] = [${transpilePythonExpr(exprs[0])}, ${transpilePythonExpr(exprs[1])}]`;
    }
  }

  const assignMatch = stmt.match(/^([a-zA-Z0-9_\[\]\.\'\"\s]+)\s*(=|\+=|-=|\*=|\/=|\/\/=)\s*(.*)$/);
  if (assignMatch) {
    const target = assignMatch[1].trim();
    const op = assignMatch[2];
    const val = transpilePythonExpr(assignMatch[3].trim());

    if (op === '//=') {
      return `${target} = Math.floor(${target} / (${val}))`;
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

function transpilePythonExpr(expr) {
  let res = expr.trim();
  res = res.replace(/\bTrue\b/g, 'true');
  res = res.replace(/\bFalse\b/g, 'false');
  res = res.replace(/\bNone\b/g, 'null');
  res = res.replace(/\band\b/g, '&&');
  res = res.replace(/\bor\b/g, '||');
  res = res.replace(/\bnot\s+/g, '!');
  // Integer division //
  res = res.replace(/\(([^()]+)\)\s*\/\/\s*([a-zA-Z0-9_]+)/g, '__py_idiv(($1), $2)');
  res = res.replace(/([a-zA-Z0-9_\.]+)\s*\/\/\s*([a-zA-Z0-9_\.]+)/g, '__py_idiv($1, $2)');
  res = res.replace(/([a-zA-Z0-9_\.\(\)]+)\s*\*\*\s*([a-zA-Z0-9_\.\(\)]+)/g, 'Math.pow($1, $2)');
  res = res.replace(/\blen\s*\((.*?)\)/g, '__py_len($1)');
  res = res.replace(/\brange\s*\((.*?)\)/g, '__py_range($1)');
  res = res.replace(/\bprint\s*\(/g, 'console.log(');
  res = res.replace(/([a-zA-Z0-9_]+)\[\s*:\s*:\s*-1\s*\]/g, '__py_slice($1, null, null, -1)');
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

  const doubleListComp = res.match(/^\[\s*([a-zA-Z0-9_]+)\s+for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_]+)\s+for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_]+)\s*\]$/);
  if (doubleListComp) {
    const outVar = doubleListComp[1];
    const subVar = doubleListComp[2];
    const listVar = doubleListComp[3];
    const innerVar = doubleListComp[4];
    const innerList = doubleListComp[5];
    return `(${listVar}.flatMap(${subVar} => ${innerList}))`;
  }

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

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed++;
  console.error(`  ✗ FAIL: ${name} (${detail})`);
}

function runPython(code, funcName, args) {
  const js = transpilePythonToJs(code);
  const factory = new Function(PYTHON_RUNTIME_HELPERS + '\n' + js + '\nreturn ' + funcName + ';');
  const fn = factory();
  return fn(...args);
}

console.log('\nPython Transpiler and Offline Engine smoke test');

// 1. Celsius to Fahrenheit
const celsiusCode = `def celsius_to_fahrenheit(c):
    return (c * 9/5) + 32`;
if (runPython(celsiusCode, 'celsius_to_fahrenheit', [0]) === 32) ok('celsius_to_fahrenheit(0) == 32'); else fail('celsius 0');
if (runPython(celsiusCode, 'celsius_to_fahrenheit', [100]) === 212) ok('celsius_to_fahrenheit(100) == 212'); else fail('celsius 100');
if (runPython(celsiusCode, 'celsius_to_fahrenheit', [-40]) === -40) ok('celsius_to_fahrenheit(-40) == -40'); else fail('celsius -40');

// 2. Palindrome with [::-1]
const palCode = `def is_palindrome(s):
    cleaned = s.lower()
    return cleaned == cleaned[::-1]`;
if (runPython(palCode, 'is_palindrome', ['racecar']) === true) ok('is_palindrome("racecar") == True'); else fail('palindrome racecar');
if (runPython(palCode, 'is_palindrome', ['hello']) === false) ok('is_palindrome("hello") == False'); else fail('palindrome hello');
if (runPython(palCode, 'is_palindrome', ['Madam']) === true) ok('is_palindrome("Madam") == True'); else fail('palindrome Madam');

// 3. FizzBuzz with range & elif
const fzCode = `def fizzbuzz(n):
    result = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(i)
    return result`;
const fzRes = runPython(fzCode, 'fizzbuzz', [5]);
if (JSON.stringify(fzRes) === JSON.stringify([1, 2, 'Fizz', 4, 'Buzz'])) ok('fizzbuzz(5) produces correct list'); else fail('fizzbuzz');

// 4. List Comprehension
const listCompCode = `def double_all(nums):
    return [x * 2 for x in nums]`;
if (JSON.stringify(runPython(listCompCode, 'double_all', [[1, 2, 3, 4]])) === JSON.stringify([2, 4, 6, 8])) ok('list comprehension doubles all'); else fail('list comp');

// 5. Dict and Word Count
const wcCode = `def word_count(text):
    counts = {}
    for w in text.lower().split():
        counts[w] = counts.get(w, 0) + 1
    return counts`;
const wcRes = runPython(wcCode, 'word_count', ['the cat sat on the mat']);
if (wcRes && wcRes.the === 2 && wcRes.cat === 1) ok('word_count calculates word frequencies'); else fail('word count');

// 6. Binary Search with integer division
const bsCode = `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`;
if (runPython(bsCode, 'binary_search', [[1, 3, 5, 7, 9], 7]) === 3) ok('binary_search finds index 3'); else fail('binary search found');
if (runPython(bsCode, 'binary_search', [[1, 3, 5, 7, 9], 4]) === -1) ok('binary_search returns -1 when missing'); else fail('binary search missing');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('python_smoke: OK');
}
