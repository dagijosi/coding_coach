/**
 * Polyglot Multi-Language & Multi-Framework Smoke Test
 * Tests PHP / Laravel, React / JSX, and JavaScript execution.
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
`;

export function transpilePhpToJs(phpCode) {
  let code = phpCode.trim();
  code = code.replace(/^<\?php\s*/i, '');
  code = code.replace(/\?>\s*$/i, '');
  code = code.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1');
  code = code.replace(/\bfn\s*\(/g, '(');
  code = code.replace(/=>/g, ':');
  code = code.replace(/([a-zA-Z0-9_\)\]\'\"])\s*\.\s*([a-zA-Z0-9_\(\[\'\"])/g, '$1 + $2');
  code = code.replace(/->/g, '.');
  code = code.replace(/\becho\s+(.*?);/g, '__php_echo($1);');
  code = code.replace(/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)(?:\s*:\s*[a-zA-Z0-9_]+)?\s*\{/g, 'function $1($2) {');
  code = code.replace(/\bnull\b/gi, 'null');
  code = code.replace(/\btrue\b/gi, 'true');
  code = code.replace(/\bfalse\b/gi, 'false');
  return code;
}

export const REACT_RUNTIME_HELPERS = `
var React = {
  createElement: function (type, props) {
    var children = Array.prototype.slice.call(arguments, 2);
    var flatChildren = [];
    children.forEach(function (c) {
      if (Array.isArray(c)) flatChildren = flatChildren.concat(c);
      else if (c !== null && c !== undefined && c !== false) flatChildren.push(c);
    });

    if (typeof type === "function") {
      var componentProps = Object.assign({}, props || {}, { children: flatChildren });
      return type(componentProps);
    }

    return {
      type: type,
      props: Object.assign({}, props || {}, {
        children: flatChildren.length === 1 ? flatChildren[0] : flatChildren
      })
    };
  },

  useState: function (initialValue) {
    var state = typeof initialValue === "function" ? initialValue() : initialValue;
    var setState = function (newVal) {
      state = typeof newVal === "function" ? newVal(state) : newVal;
    };
    return [state, setState];
  },

  useEffect: function (callback) {
    try { callback(); } catch (e) {}
  }
};

var useState = React.useState;
var useEffect = React.useEffect;

function renderToString(vnode) {
  if (vnode === null || vnode === undefined || vnode === false) return "";
  if (typeof vnode === "string" || typeof vnode === "number") return String(vnode);
  if (Array.isArray(vnode)) return vnode.map(renderToString).join("");

  if (vnode && vnode.type) {
    var tag = vnode.type;
    var props = vnode.props || {};
    var attrs = [];

    Object.keys(props).forEach(function (k) {
      if (k === "children") return;
      var propName = k === "className" ? "class" : k;
      attrs.push(propName + '="' + String(props[k]) + '"');
    });

    var attrStr = attrs.length > 0 ? " " + attrs.join(" ") : "";
    var childrenStr = props.children ? renderToString(props.children) : "";
    return "<" + tag + attrStr + ">" + childrenStr + "</" + tag + ">";
  }

  return JSON.stringify(vnode);
}
`;

export function transpileJsxToJs(jsxCode) {
  let code = jsxCode;

  // Simple JSX self-closing tags: <Tag prop="val" />
  code = code.replace(/<([a-zA-Z0-9_\.]+)\s*([^>]*?)\/>/g, (_, tag, attrs) => {
    const propsObj = parseJsxAttributes(attrs);
    const tagArg = /^[A-Z]/.test(tag) ? tag : `'${tag}'`;
    return `React.createElement(${tagArg}, ${propsObj})`;
  });

  // Paired tags repeatedly from innermost to outermost
  let prev;
  do {
    prev = code;
    code = code.replace(/<([a-zA-Z0-9_\.]+)\s*([^>]*?)>((?:(?!<[a-zA-Z0-9_\.]+).)*?)<\/\1>/gs, (_, tag, attrs, children) => {
      const propsObj = parseJsxAttributes(attrs);
      const tagArg = /^[A-Z]/.test(tag) ? tag : `'${tag}'`;
      const trimmed = children.trim();
      let childExpr = 'null';
      if (trimmed.startsWith('React.createElement')) {
        childExpr = trimmed;
      } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        childExpr = trimmed.slice(1, -1);
      } else if (trimmed.length > 0) {
        childExpr = JSON.stringify(trimmed);
      }
      return `React.createElement(${tagArg}, ${propsObj}, ${childExpr})`;
    });
  } while (prev !== code);

  return code;
}

function parseJsxAttributes(attrsStr) {
  if (!attrsStr || !attrsStr.trim()) return 'null';
  const pairs = [];
  const regex = /([a-zA-Z0-9_-]+)=(?:\{([^}]+)\}|"([^"]*)")/g;
  let match;
  while ((match = regex.exec(attrsStr)) !== null) {
    const key = match[1];
    const val = match[2] !== undefined ? match[2] : JSON.stringify(match[3]);
    pairs.push(`"${key}": ${val}`);
  }
  return pairs.length > 0 ? `{ ${pairs.join(', ')} }` : 'null';
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

function runPhp(code, funcName, args) {
  const js = transpilePhpToJs(code);
  const factory = new Function(PHP_LARAVEL_RUNTIME_HELPERS + '\n' + js + '\nreturn ' + funcName + ';');
  const fn = factory();
  const res = fn(...args);
  if (res && typeof res === 'object' && typeof res.toArray === 'function') {
    return res.toArray();
  }
  return res;
}

function runReact(code, componentName, props = {}) {
  const js = transpileJsxToJs(code);
  const runner = new Function('props', REACT_RUNTIME_HELPERS + '\n' + js + '\nvar vnode = React.createElement(' + componentName + ', props);\nreturn renderToString(vnode);');
  return runner(props);
}

console.log('\nPolyglot Language & Framework Engine smoke test');

// 1. PHP Functions & String manipulation
const phpStrCode = `<?php
function format_user_name($first, $last) {
    return strtoupper($first) . " " . ucfirst($last);
}`;
const phpName = runPhp(phpStrCode, 'format_user_name', ['john', 'doe']);
if (phpName.includes('JOHN Doe')) ok('PHP strtoupper & string concatenation'); else fail('php string');

// 2. Laravel Collection Pipeline
const laravelCode = `<?php
function process_scores($scores) {
    return collect($scores)
        ->filter(function($score) { return $score >= 50; })
        ->map(function($score) { return $score + 10; })
        ->toArray();
}`;
const laravelRes = runPhp(laravelCode, 'process_scores', [[40, 50, 75, 30, 90]]);
if (JSON.stringify(laravelRes) === JSON.stringify([60, 85, 100])) ok('Laravel collect() -> filter() -> map() -> toArray() pipeline'); else fail('laravel pipeline');

// 3. React JSX Component Rendering
const reactCode = `function UserCard(props) {
  const [active] = useState(true);
  return (
    <div className="card">
      <h2>{props.title}</h2>
    </div>
  );
}`;
const html = runReact(reactCode, 'UserCard', { title: 'Dagi Josi' });
if (html.includes('<div class="card">') && html.includes('Dagi Josi')) ok('React JSX component rendering to HTML'); else fail('react component');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('polyglot_smoke: OK');
}
