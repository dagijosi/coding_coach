import type { Lesson } from '@/types/learning';

// ── Lesson 10: When NOT to Use Patterns (Overengineering Traps) ────────────────
export const overengineeringLesson: Lesson = {
  id: 'lesson-arch-overengineering',
  topicId: 'topic-arch-tradeoffs',
  title: 'When NOT to Use Patterns & Overengineering Traps',
  description:
    'Senior engineers know patterns; Staff engineers know when NOT to use them. Avoid premature abstraction, YAGNI violations, and accidental complexity.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 10,
  prerequisites: ['lesson-arch-patterns'],
  content: [
    { type: 'heading', content: 'The Cost of Premature Abstraction' },
    {
      type: 'text',
      content:
        'Every layer of abstraction introduces:\n1. Cognitive load (developers must navigate 6 files to understand one function).\n2. Indirection latency & debugging friction.\n3. Misaligned abstractions that are harder to refactor than duplicated code.\n\n> *"Duplication is far cheaper than the wrong abstraction."* — Sandi Metz',
    },
    { type: 'heading', content: 'The Rule of Three' },
    {
      type: 'text',
      content:
        '- 1st time you write logic: Write simple, straightforward code.\n- 2nd time you duplicate logic: Tolerate duplication.\n- 3rd time you write similar logic: Now abstract into a generic utility or pattern.',
    },
    { type: 'heading', content: 'When NOT to use Repositories or Clean Architecture' },
    {
      type: 'code',
      language: 'typescript',
      content: `// ❌ OVERENGINEERED FOR A SIMPLE CRUD BLOG:
// UserArticleController -> CreateArticleUseCase -> ArticleRepositoryInterface -> PostgresArticleRepository -> DTO -> Mapper -> DomainEntity
// 7 files for a simple 1-table INSERT query!

// ✅ PRAGMATIC ARCHITECTURE:
// Direct TanStack Query / SQLite mutation for simple CRUD apps where business rules are trivial.
// Reserve 6-layer Clean Architecture for domains with complex invariants, billing rules, or multi-platform data sync.`,
    },
  ],
};

// ── Lesson 11: Feature-Based vs Layer-Based Architecture ───────────────────────
export const featureVsLayerLesson: Lesson = {
  id: 'lesson-arch-feature-slicing',
  topicId: 'topic-arch-tradeoffs',
  title: 'Feature-Based vs Layer-Based Architecture',
  description:
    'Horizontal layers (technical grouping) vs Vertical slices (business feature grouping). Why screaming architecture scales better with team size.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 11,
  prerequisites: ['lesson-arch-overengineering'],
  content: [
    { type: 'heading', content: 'Horizontal (Layer-First) Trap' },
    {
      type: 'text',
      content:
        'Grouping files by technical role (`controllers/`, `views/`, `models/`, `types/`) forces developers to jump between 5 different directories for every single feature ticket, causing merge conflicts in large teams.',
    },
    { type: 'heading', content: 'Vertical Slicing (Feature-First / Screaming Architecture)' },
    {
      type: 'text',
      content:
        'Co-locate everything belonging to a user feature (UI component, state hook, API client, types, tests) inside a single feature directory:\n\n```\nsrc/features/checkout/\n  ├── components/CheckoutModal.tsx\n  ├── hooks/useCheckoutFlow.ts\n  ├── api/checkoutApi.ts\n  ├── types.ts\n  └── index.ts # Explicit public API boundary export\n```\n\nDeleting or refactoring a feature only requires touching one directory.',
    },
  ],
};

// ── Lesson 12: System Evolution & Migration Strategies ─────────────────────────
export const systemEvolutionLesson: Lesson = {
  id: 'lesson-arch-system-evolution',
  topicId: 'topic-arch-tradeoffs',
  title: 'System Evolution & Migration Strategies',
  description:
    'Safely migrate production systems without risky "Big Bang" rewrites using the Strangler Fig Pattern, feature flags, and parallel runs.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 12,
  prerequisites: ['lesson-arch-feature-slicing'],
  content: [
    { type: 'heading', content: 'Why Big Bang Rewrites Fail' },
    {
      type: 'text',
      content:
        'Rewriting an entire production system from scratch in a secret branch almost always fails because:\n- Production requirements and bugfixes continue evolving on the live app.\n- Edge cases accumulated over years are lost.\n- Release day risk is catastrophic.',
    },
    { type: 'heading', content: 'The Strangler Fig Pattern' },
    {
      type: 'text',
      content:
        'Incrementally replace individual features or routes one by one behind a routing proxy or feature flag until the legacy codebase has withered away and can be safely deleted.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// Routing proxy routing traffic incrementally to new clean architecture module
export function resolvePaymentProcessor(user: UserAccount) {
  if (featureFlags.isEnabled('NEW_PAYMENT_ENGINE', user.id)) {
    return new ModernPaymentEngine(); // Clean Architecture
  }
  return new LegacyPaymentScript();   // Legacy fallback
}`,
    },
  ],
};
