import type { Lesson } from '@/types/learning';

// ── Lesson 1: Components & JSX ────────────────────────────────────────────────
export const componentsLesson: Lesson = {
  id: 'lesson-react-components',
  topicId: 'topic-react-fundamentals',
  title: 'Components & JSX',
  description: 'Build your first typed React components with JSX and understand how React renders UI.',
  language: 'typescript',
  difficulty: 'beginner',
  estimatedMinutes: 20,
  order: 1,
  prerequisites: [],
  content: [
    { type: 'heading', content: 'What is a Component?' },
    {
      type: 'text',
      content:
        'A React component is a function that returns JSX — a syntax that looks like HTML but compiles to JavaScript. TypeScript lets you annotate what a component accepts and returns.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// The simplest possible component
function Greeting(): JSX.Element {
  return <h1>Hello, World!</h1>;
}

// Arrow function style (equally valid)
const Greeting = (): JSX.Element => <h1>Hello, World!</h1>;`,
    },
    { type: 'heading', content: 'JSX Rules' },
    {
      type: 'text',
      content:
        'JSX looks like HTML but has a few key differences: use className instead of class, all tags must be closed (including self-closing like <br />), and you can only return one root element — wrap siblings in a Fragment (<> </>).',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `function UserCard(): JSX.Element {
  const name = 'Alice';
  const isOnline = true;

  return (
    <>
      <h2 className="user-name">{name}</h2>
      <span>{isOnline ? '🟢 Online' : '⚫ Offline'}</span>
      <img src="/avatar.png" alt="avatar" />
    </>
  );
}`,
    },
    { type: 'heading', content: 'Expressions in JSX' },
    {
      type: 'text',
      content:
        'Any JavaScript expression can go inside curly braces {}. You can call functions, do ternaries, and map arrays — but not if/else statements or for loops directly.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `const items = ['React', 'TypeScript', 'Vite'];

function TechList(): JSX.Element {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}`,
    },
  ],
};

// ── Lesson 2: Props & TypeScript ──────────────────────────────────────────────
export const propsLesson: Lesson = {
  id: 'lesson-react-props',
  topicId: 'topic-react-fundamentals',
  title: 'Props & TypeScript',
  description: 'Pass data into components with typed props — interfaces, optional fields, and children.',
  language: 'typescript',
  difficulty: 'beginner',
  estimatedMinutes: 22,
  order: 2,
  prerequisites: ['lesson-react-components'],
  content: [
    { type: 'heading', content: 'Typing Props with an Interface' },
    {
      type: 'text',
      content:
        'Props are the arguments you pass to a component. In TypeScript you define an interface (or type alias) for props and annotate the function parameter. This gives you autocomplete and catches mistakes at compile time.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary'; // optional with ?
  onClick: () => void;
}

function Button({ label, variant = 'primary', onClick }: ButtonProps): JSX.Element {
  return (
    <button className={\`btn btn--\${variant}\`} onClick={onClick}>
      {label}
    </button>
  );
}

// Usage — TypeScript will error if you forget required props
<Button label="Save" onClick={() => console.log('saved')} />`,
    },
    { type: 'heading', content: 'The children Prop' },
    {
      type: 'text',
      content:
        'The children prop lets a component wrap arbitrary JSX. Use React.PropsWithChildren<T> or include children: React.ReactNode in your interface.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
}

function Card({ title, children }: CardProps): JSX.Element {
  return (
    <div className="card">
      <h3 className="card__title">{title}</h3>
      <div className="card__body">{children}</div>
    </div>
  );
}

// Usage:
<Card title="Profile">
  <p>Name: Alice</p>
  <p>Role: Engineer</p>
</Card>`,
    },
    { type: 'heading', content: 'ComponentProps — Extending Native Elements' },
    {
      type: 'text',
      content:
        'Use React.ComponentProps to extend native HTML element props, so your component automatically inherits all valid HTML attributes.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import { ComponentProps } from 'react';

// Extends all native <input> attributes
type InputProps = ComponentProps<'input'> & {
  label: string;
  error?: string;
};

function TextInput({ label, error, ...inputProps }: InputProps): JSX.Element {
  return (
    <div>
      <label>{label}</label>
      <input {...inputProps} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}`,
    },
  ],
};

// ── Lesson 3: State & Events ──────────────────────────────────────────────────
export const stateLesson: Lesson = {
  id: 'lesson-react-state',
  topicId: 'topic-react-fundamentals',
  title: 'State & Events',
  description: 'Manage dynamic data with useState and handle typed events in React.',
  language: 'typescript',
  difficulty: 'beginner',
  estimatedMinutes: 25,
  order: 3,
  prerequisites: ['lesson-react-props'],
  content: [
    { type: 'heading', content: 'useState with TypeScript' },
    {
      type: 'text',
      content:
        'useState is a hook that gives a component its own reactive data. TypeScript usually infers the type from the initial value, but you can also annotate it explicitly for complex types.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useState } from 'react';

function Counter(): JSX.Element {
  const [count, setCount] = useState(0); // inferred as number

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((prev) => prev + 1)}>+</button>
      <button onClick={() => setCount((prev) => prev - 1)}>-</button>
    </div>
  );
}`,
    },
    { type: 'heading', content: 'Typing Complex State' },
    {
      type: 'text',
      content:
        'For objects, arrays, or union types, pass the type as a generic to useState. This ensures TypeScript knows the full shape of your state.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile(): JSX.Element {
  // Explicit type — could be User or null
  const [user, setUser] = useState<User | null>(null);

  const loadUser = () => {
    setUser({ id: 1, name: 'Alice', email: 'alice@dev.io' });
  };

  return (
    <div>
      {user ? <p>{user.name}</p> : <p>No user loaded</p>}
      <button onClick={loadUser}>Load User</button>
    </div>
  );
}`,
    },
    { type: 'heading', content: 'Typed Event Handlers' },
    {
      type: 'text',
      content:
        'React has its own event types. For input events use React.ChangeEvent<HTMLInputElement>, for form submission use React.FormEvent<HTMLFormElement>, for clicks use React.MouseEvent<HTMLButtonElement>.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useState, ChangeEvent, FormEvent } from 'react';

function SearchForm(): JSX.Element {
  const [query, setQuery] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Searching for:', query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      <button type="submit">Search</button>
    </form>
  );
}`,
    },
  ],
};
