import type { Lesson } from '@/types/learning';

// ── Lesson 17: State Architecture ──────────────────────────────────────────────
export const stateArchitectureLesson: Lesson = {
  id: 'lesson-fe-state-architecture',
  topicId: 'topic-architecture-a11y',
  title: 'State Architecture & Store Patterns',
  description:
    'Categorize state (Local, URL, Server, Global), avoid prop drilling without context re-render bloat, and master Zustand.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 17,
  prerequisites: ['lesson-tanstack-query'],
  content: [
    { type: 'heading', content: 'The 4 Types of State' },
    {
      type: 'text',
      content:
        '1. **URL State**: Search params, active tab, pagination — shareable & bookmarkable (`useSearchParams`).\n2. **Server State**: Remote data managed via TanStack Query.\n3. **Local/UI State**: Form inputs, dropdown visibility, toggle state (`useState`, `useReducer`).\n4. **Global Client State**: User session, app theme, notification queue, shopping cart.\n\n*Rule of thumb*: 80% of what developers historically put in Redux is actually Server State and should live in TanStack Query.',
    },
    { type: 'heading', content: 'Zustand: Lightweight Global State' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        addItem: (item) =>
          set((state) => {
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.id === item.id ? { ...i, qty: i.qty + item.qty } : i
                ),
              };
            }
            return { items: [...state.items, item] };
          }),
        removeItem: (id) =>
          set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
        clearCart: () => set({ items: [] }),
        totalPrice: () =>
          get().items.reduce((sum, item) => sum + item.price * item.qty, 0),
      }),
      { name: 'shopping-cart-storage' }
    )
  )
);

// ✅ Atomic selector prevents unnecessary re-renders:
function CartBadge() {
  const count = useCartStore((state) => state.items.length);
  return <span>{count}</span>;
}`,
    },
  ],
};

// ── Lesson 18: Advanced Hooks & Custom Hook Composition ────────────────────────
export const advancedHooksLesson: Lesson = {
  id: 'lesson-fe-advanced-hooks',
  topicId: 'topic-architecture-a11y',
  title: 'Advanced Hooks & Hook Composition',
  description:
    'Master useReducer with discriminated unions, useSyncExternalStore, and design composable headless custom hooks.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 18,
  prerequisites: ['lesson-react-state'],
  content: [
    { type: 'heading', content: 'useReducer with Discriminated Unions' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useReducer } from 'react';

interface State {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: string | null;
  error: string | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: string }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', data: null, error: null };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.payload, error: null };
    case 'FETCH_ERROR':
      return { status: 'error', data: null, error: action.payload };
    case 'RESET':
      return { status: 'idle', data: null, error: null };
  }
}`,
    },
    { type: 'heading', content: 'useSyncExternalStore for Non-React Stores' },
    {
      type: 'text',
      content:
        'Introduced in React 18 to solve tearing in concurrent rendering when reading from external browser subscriptions (e.g. `window.matchMedia`, browser geolocation, or non-React state managers).',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine, // Client snapshot
    () => true              // Server snapshot for SSR
  );
}`,
    },
  ],
};

// ── Lesson 19: Accessibility (a11y) & WCAG ──────────────────────────────────────
export const accessibilityLesson: Lesson = {
  id: 'lesson-fe-accessibility',
  topicId: 'topic-architecture-a11y',
  title: 'Web Accessibility (a11y) & ARIA',
  description:
    'Build inclusive web applications compliant with WCAG 2.1 AA: focus trapping, keyboard navigation, and semantic ARIA roles.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 25,
  order: 19,
  prerequisites: ['lesson-react-components'],
  content: [
    { type: 'heading', content: 'Semantic HTML First' },
    {
      type: 'text',
      content:
        'The first rule of ARIA is: *Do not use ARIA if a native HTML element already provides the semantics and keyboard behavior*.\n\nUse `<button>` instead of `<div onClick>`, `<nav>` for navigation links, and `<dialog>` for modals.',
    },
    { type: 'heading', content: 'Accessible Modal & Focus Trapping' },
    {
      type: 'code',
      language: 'typescript',
      content: `import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({ isOpen, onClose, title, children }: ModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose} aria-label="Close dialog">Close</button>
      </div>
    </div>
  );
}`,
    },
  ],
};

// ── Lesson 20: Scalable Frontend Architecture ──────────────────────────────────
export const frontendArchitectureLesson: Lesson = {
  id: 'lesson-fe-architecture',
  topicId: 'topic-architecture-a11y',
  title: 'Scalable Frontend Architecture',
  description:
    'Design patterns for massive codebases: Feature-Sliced Design, compound component pattern, and strict module boundaries.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 20,
  prerequisites: ['lesson-fe-state-architecture'],
  content: [
    { type: 'heading', content: 'Feature-Sliced Architecture' },
    {
      type: 'text',
      content:
        'Instead of organizing code by technical type (`components/`, `hooks/`, `services/`), organize by domain feature slices:\n\n```\nsrc/\n  ├── app/          # Global providers, routing, root layouts\n  ├── pages/        # Compositional page entry points\n  ├── widgets/      # Self-contained UI blocks (Header, Sidebar)\n  ├── features/     # User interactions (AuthByEmail, AddToCart)\n  ├── entities/     # Domain business entities (User, Product, Cart)\n  └── shared/       # Reusable UI kit, API clients, helpers\n```',
    },
    { type: 'heading', content: 'Compound Component Pattern' },
    {
      type: 'code',
      language: 'typescript',
      content: `import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabList({ children }: { children: ReactNode }) {
  return <div role="tablist" className="tabs__list">{children}</div>;
};

Tabs.Tab = function Tab({ id, children }: { id: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.Tab must be used within <Tabs>');

  const isSelected = ctx.activeTab === id;
  return (
    <button
      role="tab"
      aria-selected={isSelected}
      onClick={() => ctx.setActiveTab(id)}
      className={\`tab \${isSelected ? 'tab--active' : ''}\`}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.Panel must be used within <Tabs>');
  if (ctx.activeTab !== id) return null;
  return <div role="tabpanel" className="tabs__panel">{children}</div>;
};

// Clean, declarative compound usage:
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab id="profile">Profile</Tabs.Tab>
    <Tabs.Tab id="security">Security</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="profile"><p>Profile Details</p></Tabs.Panel>
  <Tabs.Panel id="security"><p>Password Change</p></Tabs.Panel>
</Tabs>;`,
    },
  ],
};
