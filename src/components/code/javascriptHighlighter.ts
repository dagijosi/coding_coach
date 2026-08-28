export type CodeSegment = {
  text: string;
  color: string;
};

const KEYWORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'async',
  'await',
]);

const LITERALS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'NaN',
  'Infinity',
]);

const NUMBERS =
  /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\b/;

const IDENTIFIER = /[A-Za-z_$][A-Za-z0-9_$]*/y;

const STRING =
  /(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")/y;

const TEMPLATE =
  /`(?:[^`\\]|\\.|\\\n)*`/y;

export function highlightJavaScript(
  source: string,
  colors: {
    keyword: string;
    literal: string;
    string: string;
    number: string;
    comment: string;
    default: string;
  }
): CodeSegment[] {
  const segments: CodeSegment[] = [];
  let pos = 0;

  function push(text: string, color: string): void {
    if (text.length === 0) {
      return;
    }
    segments.push({ text, color });
  }

  while (pos < source.length) {
    // Line comments
    if (source.startsWith('//', pos)) {
      const nl = source.indexOf('\n', pos);
      const end = nl === -1 ? source.length : nl;
      push(source.slice(pos, end), colors.comment);
      pos = end;
      continue;
    }

    // Block comments
    if (source.startsWith('/*', pos)) {
      const end = source.indexOf('*/', pos + 2);
      const stop = end === -1 ? source.length : end + 2;
      push(source.slice(pos, stop), colors.comment);
      pos = stop;
      continue;
    }

    // Strings (single and double quoted)
    STRING.lastIndex = pos;
    const strMatch = STRING.exec(source);
    if (strMatch) {
      push(strMatch[0], colors.string);
      pos = strMatch.index + strMatch[0].length;
      continue;
    }

    // Template literals (backticks)
    TEMPLATE.lastIndex = pos;
    const tplMatch = TEMPLATE.exec(source);
    if (tplMatch) {
      push(tplMatch[0], colors.string);
      pos = tplMatch.index + tplMatch[0].length;
      continue;
    }

    // Numbers
    NUMBERS.lastIndex = pos;
    const numMatch = NUMBERS.exec(source.slice(pos));
    if (numMatch && numMatch.index === 0) {
      push(numMatch[0], colors.number);
      pos += numMatch[0].length;
      continue;
    }

    // Identifiers / keywords / literals
    IDENTIFIER.lastIndex = pos;
    const idMatch = IDENTIFIER.exec(source);
    if (idMatch && idMatch.index === pos) {
      const word = idMatch[0];
      const color = KEYWORDS.has(word)
        ? colors.keyword
        : LITERALS.has(word)
          ? colors.literal
          : colors.default;
      push(word, color);
      pos += word.length;
      continue;
    }

    // Anything else — single character
    push(source[pos], colors.default);
    pos += 1;
  }

  return segments;
}
