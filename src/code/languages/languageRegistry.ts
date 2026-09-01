import type { Ionicons } from '@expo/vector-icons';

export type LanguageId =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'react'
  | 'php'
  | 'laravel'
  | 'sql'
  | 'html'
  | 'css';

export type QuickSnippet = {
  label: string;
  insert: string;
};

export type LanguageDescriptor = {
  id: LanguageId;
  label: string;
  shortLabel: string;
  category: 'frontend' | 'backend' | 'database' | 'general';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  fileExtension: string;
  quickSnippets: QuickSnippet[];
  defaultStarterCode: (funcName?: string) => string;
};

export const LANGUAGE_REGISTRY: Record<LanguageId, LanguageDescriptor> = {
  javascript: {
    id: 'javascript',
    label: 'JavaScript (ES6+)',
    shortLabel: 'JavaScript',
    category: 'general',
    icon: 'logo-javascript',
    color: '#F7DF1E',
    fileExtension: '.js',
    quickSnippets: [
      { label: 'log()', insert: "\n  console.log('Value:', value);" },
      { label: 'return', insert: 'return ' },
      { label: 'let', insert: 'let ' },
      { label: 'const', insert: 'const ' },
      { label: '=>', insert: ' => ' },
      { label: '===', insert: ' === ' },
    ],
    defaultStarterCode: (fn = 'solution') =>
      `function ${fn}(input) {\n  // JavaScript execution\n  console.log('Input:', input);\n  return input;\n}`,
  },

  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    shortLabel: 'TypeScript',
    category: 'general',
    icon: 'code-slash',
    color: '#3178C6',
    fileExtension: '.ts',
    quickSnippets: [
      { label: ': string', insert: ': string' },
      { label: ': number', insert: ': number' },
      { label: ': boolean', insert: ': boolean' },
      { label: 'interface', insert: 'interface Props {\n  \n}' },
      { label: 'type', insert: 'type Result = ' },
      { label: 'return', insert: 'return ' },
    ],
    defaultStarterCode: (fn = 'solution') =>
      `function ${fn}(input: any): any {\n  // TypeScript execution\n  console.log('Input:', input);\n  return input;\n}`,
  },

  python: {
    id: 'python',
    label: 'Python 3',
    shortLabel: 'Python',
    category: 'backend',
    icon: 'logo-python',
    color: '#3776AB',
    fileExtension: '.py',
    quickSnippets: [
      { label: 'def', insert: 'def ' },
      { label: 'return', insert: 'return ' },
      { label: 'print()', insert: "\n    print('Value is:', result)" },
      { label: 'range()', insert: 'range(1, 10)' },
      { label: 'len()', insert: 'len(' },
      { label: 'if', insert: 'if ' },
      { label: 'in', insert: ' in ' },
      { label: '[x for x in]', insert: '[x * 2 for x in nums]' },
    ],
    defaultStarterCode: (fn = 'solution') =>
      `def ${fn}(value):\n    # Python 3 execution\n    print("Input:", value)\n    return value`,
  },

  react: {
    id: 'react',
    label: 'React & JSX',
    shortLabel: 'React',
    category: 'frontend',
    icon: 'logo-react',
    color: '#61DAFB',
    fileExtension: '.jsx',
    quickSnippets: [
      { label: 'useState', insert: 'const [state, setState] = useState(0);' },
      { label: 'useEffect', insert: 'useEffect(() => {\n    \n  }, []);' },
      { label: '<div />', insert: '<div className=""></div>' },
      { label: 'props', insert: 'props' },
      { label: 'return ()', insert: 'return (\n    <div>\n      \n    </div>\n  );' },
    ],
    defaultStarterCode: (fn = 'App') =>
      `function ${fn}(props) {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="card">\n      <h2>Hello React</h2>\n    </div>\n  );\n}`,
  },

  php: {
    id: 'php',
    label: 'PHP 8+',
    shortLabel: 'PHP',
    category: 'backend',
    icon: 'code-working',
    color: '#777BB4',
    fileExtension: '.php',
    quickSnippets: [
      { label: 'function', insert: 'function ' },
      { label: '$var', insert: '$' },
      { label: 'return', insert: 'return ' },
      { label: 'echo', insert: 'echo ' },
      { label: 'explode()', insert: 'explode(",", $text)' },
      { label: 'count()', insert: 'count($items)' },
    ],
    defaultStarterCode: (fn = 'solution') =>
      `<?php\nfunction ${fn}($input) {\n  // PHP execution\n  echo "Input: " . $input;\n  return $input;\n}`,
  },

  laravel: {
    id: 'laravel',
    label: 'Laravel Framework',
    shortLabel: 'Laravel',
    category: 'backend',
    icon: 'layers-outline',
    color: '#FF2D20',
    fileExtension: '.php',
    quickSnippets: [
      { label: 'collect()', insert: 'collect($items)' },
      { label: '->map()', insert: '->map(fn($item) => $item * 2)' },
      { label: '->filter()', insert: '->filter(fn($item) => $item > 0)' },
      { label: '->pluck()', insert: '->pluck("id")' },
      { label: '->first()', insert: '->first()' },
      { label: '->toArray()', insert: '->toArray()' },
    ],
    defaultStarterCode: (fn = 'handleCollection') =>
      `<?php\nfunction ${fn}($data) {\n  return collect($data)\n    ->filter(fn($x) => $x > 0)\n    ->map(fn($x) => $x * 2)\n    ->toArray();\n}`,
  },

  sql: {
    id: 'sql',
    label: 'SQL (SQLite)',
    shortLabel: 'SQL',
    category: 'database',
    icon: 'server-outline',
    color: '#F29111',
    fileExtension: '.sql',
    quickSnippets: [
      { label: 'SELECT', insert: 'SELECT ' },
      { label: 'FROM', insert: 'FROM ' },
      { label: 'WHERE', insert: 'WHERE ' },
      { label: 'JOIN', insert: 'JOIN ' },
      { label: 'GROUP BY', insert: 'GROUP BY ' },
      { label: 'ORDER BY', insert: 'ORDER BY ' },
    ],
    defaultStarterCode: () =>
      `SELECT id, name, score\nFROM learners\nWHERE score >= 80\nORDER BY score DESC;`,
  },

  html: {
    id: 'html',
    label: 'HTML5',
    shortLabel: 'HTML',
    category: 'frontend',
    icon: 'logo-html5',
    color: '#E34F26',
    fileExtension: '.html',
    quickSnippets: [
      { label: '<section>', insert: '<section class="container">\n  \n</section>' },
      { label: '<button>', insert: '<button type="button">Click Me</button>' },
      { label: '<form>', insert: '<form>\n  \n</form>' },
    ],
    defaultStarterCode: () =>
      `<div class="container">\n  <h1>Interactive Preview</h1>\n  <p>Learn semantic HTML5 markup.</p>\n</div>`,
  },

  css: {
    id: 'css',
    label: 'CSS3',
    shortLabel: 'CSS',
    category: 'frontend',
    icon: 'logo-css3',
    color: '#1572B6',
    fileExtension: '.css',
    quickSnippets: [
      { label: 'display: flex', insert: 'display: flex;\nalign-items: center;\njustify-content: center;' },
      { label: 'grid', insert: 'display: grid;\ngrid-template-columns: repeat(2, 1fr);' },
      { label: 'border-radius', insert: 'border-radius: 8px;' },
    ],
    defaultStarterCode: () =>
      `.card {\n  display: flex;\n  flex-direction: column;\n  padding: 16px;\n  background: #1e293b;\n  border-radius: 12px;\n}`,
  },
};

/**
 * Normalizes any language string to a supported LanguageId.
 */
export function normalizeLanguageId(rawLanguage?: string): LanguageId {
  if (!rawLanguage) return 'javascript';
  const clean = rawLanguage.toLowerCase().trim();

  if (clean.includes('python') || clean === 'py') return 'python';
  if (clean.includes('react') || clean === 'jsx' || clean === 'tsx') return 'react';
  if (clean.includes('laravel')) return 'laravel';
  if (clean.includes('php')) return 'php';
  if (clean.includes('typescript') || clean === 'ts') return 'typescript';
  if (clean.includes('sql') || clean === 'sqlite') return 'sql';
  if (clean.includes('html')) return 'html';
  if (clean.includes('css')) return 'css';

  return 'javascript';
}

/**
 * Retrieves the full language descriptor.
 */
export function getLanguageDescriptor(rawLanguage?: string): LanguageDescriptor {
  const id = normalizeLanguageId(rawLanguage);
  return LANGUAGE_REGISTRY[id] ?? LANGUAGE_REGISTRY.javascript;
}

/**
 * Automatically detects the language from code signatures when language isn't explicitly provided.
 */
export function detectLanguageFromCode(code: string): LanguageId {
  const trimmed = code.trim();

  if (/<\?php|\bcollect\(|\$[a-zA-Z_]/.test(trimmed)) {
    if (/\bcollect\(|->map\(|->filter\(|->pluck\(/.test(trimmed)) {
      return 'laravel';
    }
    return 'php';
  }

  if (/\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(|import\s+[a-zA-Z_]|\bprint\(|\[.*?for.*?in.*?\]/.test(trimmed)) {
    return 'python';
  }

  if (/<[A-Z][a-zA-Z0-9_]*|<div|<span|<button|\buseState\(|\buseEffect\(/.test(trimmed)) {
    return 'react';
  }

  if (/\bSELECT\b.*?\bFROM\b|\bINSERT\s+INTO\b|\bCREATE\s+TABLE\b/i.test(trimmed)) {
    return 'sql';
  }

  if (/:\s*(string|number|boolean|any)\b|\binterface\s+[A-Z]|\btype\s+[A-Z]/.test(trimmed)) {
    return 'typescript';
  }

  return 'javascript';
}
