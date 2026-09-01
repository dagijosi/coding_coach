/**
 * Offline React & JSX Transpiler and Runtime for React Native.
 * Transpiles JSX into React.createElement / Virtual DOM structures and simulates
 * useState, useEffect, props, and component evaluation.
 */

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
  },

  useMemo: function (factory) { return factory(); },
  useCallback: function (fn) { return fn; }
};

var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;
var useCallback = React.useCallback;

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

/**
 * Transpiles JSX tags <tag ...>...</tag> into React.createElement calls.
 */
export function transpileJsxToJs(jsxCode: string): string {
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

function parseJsxAttributes(attrsStr: string): string {
  if (!attrsStr || !attrsStr.trim()) return 'null';
  const pairs: string[] = [];
  const regex = /([a-zA-Z0-9_-]+)=(?:\{([^}]+)\}|"([^"]*)")/g;
  let match;
  while ((match = regex.exec(attrsStr)) !== null) {
    const key = match[1];
    const val = match[2] !== undefined ? match[2] : JSON.stringify(match[3]);
    pairs.push(`"${key}": ${val}`);
  }
  return pairs.length > 0 ? `{ ${pairs.join(', ')} }` : 'null';
}

/**
 * Generates executable JavaScript for React component / JSX execution.
 */
export function buildReactRunScript(options: {
  taskId: string;
  code: string;
  functionName: string;
  args: unknown[];
}): string {
  const transpiled = transpileJsxToJs(options.code);
  const payload = JSON.stringify(options);

  return [
    '(() => {',
    '  var payload = ' + payload + ';',
    '  ' + REACT_RUNTIME_HELPERS,
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
    '      post({ status: "error", error: "JSX Compilation error: " + String((syntaxErr && syntaxErr.message) || syntaxErr), errorType: "syntax", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var Component = factory();',
    '    if (typeof Component !== "function") {',
    '      post({ status: "error", error: "React Error: Component \\"" + payload.functionName + "\\" is not a valid React component.", errorType: "logical", executionTimeMs: Date.now() - startedAt });',
    '      return;',
    '    }',
    '    var props = Array.isArray(payload.args) && payload.args.length > 0 && typeof payload.args[0] === "object" ? payload.args[0] : {};',
    '    var vnode = React.createElement(Component, props);',
    '    var html = renderToString(vnode);',
    '    post({ status: "success", value: { html: html, vnode: vnode }, executionTimeMs: Date.now() - startedAt });',
    '  } catch (e) {',
    '    post({ status: "error", error: "React Error: " + String((e && e.message) || e), errorType: "runtime", executionTimeMs: Date.now() });',
    '  }',
    '})();',
    'true;',
  ].join('\n');
}
