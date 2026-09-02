import type { Challenge } from '@/types/learning';

export const architectureChallenges: Challenge[] = [
  // ── Challenge 1: In-Memory Repository Implementation ──
  {
    id: 'challenge-arch-in-memory-repo',
    lessonId: 'lesson-arch-repository',
    title: 'In-Memory Repository Implementation',
    description:
      'Implement an in-memory repository object createRepository() supporting save(entity), findById(id), and delete(id). The repository must store entities in an internal Map and return deep copies (or cloned objects) so external mutations do not corrupt stored records.',
    difficulty: 'medium',
    order: 1,
    functionName: 'createRepository',
    starterCode: `function createRepository() {
  const store = new Map();

  return {
    save(entity) {
      // Store a clone of entity with entity.id
    },
    findById(id) {
      // Return a clone of the entity, or null if not found
    },
    delete(id) {
      // Delete entity by id, return true if found & deleted, false otherwise
    }
  };
}`,
    testCases: [
      {
        id: 'tc-arch-repo-1',
        args: [],
        expected: true,
      },
    ],
    hints: [
      {
        id: 'hint-arch-repo-1',
        content: 'Use structuredClone(entity) or { ...entity } when storing and returning to avoid shared references.',
        order: 1,
      },
    ],
    explanation:
      'In-memory repositories simulate database isolation for unit testing by maintaining their own key-value store and returning isolated copies.',
  },

  // ── Challenge 2: Strategy Pattern Pricing Engine ──
  {
    id: 'challenge-arch-pricing-strategy',
    lessonId: 'lesson-arch-behavioral-patterns',
    title: 'Dynamic Pricing Strategy Engine',
    description:
      'Write a function createPricingEngine(strategies) that returns an engine with calculate(price, strategyName). If strategyName is not registered, it should fall back to returning the original price unchanged.',
    difficulty: 'easy',
    order: 2,
    functionName: 'createPricingEngine',
    starterCode: `function createPricingEngine(strategies) {
  // strategies is an object: { VIP: (price) => price * 0.8, ... }
  return {
    calculate(price, strategyName) {
      // Execute the matching strategy or return price as-is
    }
  };
}`,
    testCases: [
      {
        id: 'tc-arch-strat-1',
        args: [{ VIP: (p: number) => p * 0.8, SALE: (p: number) => p - 10 }],
        expected: 80,
      },
    ],
    hints: [
      {
        id: 'hint-arch-strat-1',
        content: 'Check if strategies[strategyName] exists. If so, call strategies[strategyName](price); otherwise return price.',
        order: 1,
      },
    ],
    explanation:
      'The Strategy pattern replaces rigid switch-statements with an open registry of pricing functions.',
  },

  // ── Challenge 3: Anti-Corruption DTO Mapper ──
  {
    id: 'challenge-arch-dto-mapper',
    lessonId: 'lesson-arch-api-boundaries',
    title: 'Anti-Corruption Layer DTO Mapper',
    description:
      'Write a pure function mapUserDtoToEntity(dto) that transforms raw backend snake_cased DTO { user_id, first_name, last_name, is_active } into a clean domain model { id, fullName, isActive } where fullName is trimmed.',
    difficulty: 'easy',
    order: 3,
    functionName: 'mapUserDtoToEntity',
    starterCode: `function mapUserDtoToEntity(dto) {
  // Transform snake_cased DTO to clean domain entity
}`,
    testCases: [
      {
        id: 'tc-arch-map-1',
        args: [{ user_id: '101', first_name: 'Ada', last_name: 'Lovelace', is_active: 1 }],
        expected: { id: '101', fullName: 'Ada Lovelace', isActive: true },
      },
      {
        id: 'tc-arch-map-2',
        args: [{ user_id: '102', first_name: 'Grace', last_name: '', is_active: 0 }],
        expected: { id: '102', fullName: 'Grace', isActive: false },
      },
    ],
    hints: [
      {
        id: 'hint-arch-map-1',
        content: 'Combine first_name and last_name with a space and .trim() it. Convert is_active to a boolean with Boolean(dto.is_active).',
        order: 1,
      },
    ],
    explanation:
      'Anti-Corruption mappers guarantee that internal domain contracts remain pristine regardless of external API idiosyncrasies.',
  },
];
