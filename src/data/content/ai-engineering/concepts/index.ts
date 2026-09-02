import type { Concept } from '@/types/learning';

export const aiEngineeringConcepts: Concept[] = [
  // ── Lesson 1: LLM APIs ──
  {
    id: 'concept-ai-tokens-roles',
    lessonId: 'lesson-ai-llm-apis',
    name: 'Message Roles & Tokenization',
    summary:
      'Chat models rely on system, user, assistant, and tool message hierarchies, with BPE tokenization determining pricing and context limits.',
    order: 1,
  },
  {
    id: 'concept-ai-temp-top-p',
    lessonId: 'lesson-ai-llm-apis',
    name: 'Temperature vs Top-P',
    summary:
      'Temperature controls randomness; low temperature (0.0–0.2) ensures deterministic formatting for code and JSON schemas.',
    order: 2,
  },

  // ── Lesson 2: Structured Outputs ──
  {
    id: 'concept-ai-constrained-decoding',
    lessonId: 'lesson-ai-structured-outputs',
    name: 'Grammar-Constrained Decoding',
    summary:
      'Strict structured outputs enforce JSON schemas at the token sampling level, guaranteeing zero parse failures.',
    order: 1,
  },
  {
    id: 'concept-ai-zod-schemas',
    lessonId: 'lesson-ai-structured-outputs',
    name: 'Type-Safe Zod Schemas',
    summary:
      'Zod bridges runtime LLM validation and compile-time TypeScript types with z.infer<typeof Schema>.',
    order: 2,
  },

  // ── Lesson 3: Prompt Engineering ──
  {
    id: 'concept-ai-few-shot-cot',
    lessonId: 'lesson-ai-prompt-context',
    name: 'Few-Shot & Chain-of-Thought (CoT)',
    summary:
      'Providing in-context input/output examples and encouraging step-by-step reasoning significantly enhances model accuracy.',
    order: 1,
  },
  {
    id: 'concept-ai-context-budgeting',
    lessonId: 'lesson-ai-prompt-context',
    name: 'Context Window Budgeting',
    summary:
      'Sliding window context trimmers preserve essential system prompts while pruning older conversational turns.',
    order: 2,
  },

  // ── Lesson 4: Tool Calling ──
  {
    id: 'concept-ai-function-schemas',
    lessonId: 'lesson-ai-tool-calling',
    name: 'JSON Schema Tool Contracts',
    summary:
      'Models emit structured function call arguments which your backend executes safely before feeding observations back.',
    order: 1,
  },

  // ── Lesson 5: ReAct Loop ──
  {
    id: 'concept-ai-react-cycle',
    lessonId: 'lesson-ai-react-agent',
    name: 'ReAct Agent Loop',
    summary:
      'Iterative Thought -> Action -> Observation cycle enabling autonomous multi-step reasoning and self-correction.',
    order: 1,
  },

  // ── Lesson 6: Multi-Agent ──
  {
    id: 'concept-ai-specialized-agents',
    lessonId: 'lesson-ai-multi-agent',
    name: 'Specialist Sub-Agent Decomposition',
    summary:
      'Decompose large goals into specialized roles (Planner, Executor, Critic/Reviewer) for higher reliability.',
    order: 1,
  },

  // ── Lesson 7: Embeddings ──
  {
    id: 'concept-ai-cosine-similarity',
    lessonId: 'lesson-ai-embeddings',
    name: 'Vector Embeddings & Cosine Similarity',
    summary:
      'High-dimensional float vectors map semantic meaning; cosine similarity measures directional closeness (-1.0 to 1.0).',
    order: 1,
  },

  // ── Lesson 8: RAG ──
  {
    id: 'concept-ai-grounded-rag',
    lessonId: 'lesson-ai-rag-pipeline',
    name: 'Retrieval-Augmented Generation (RAG)',
    summary:
      'Inject retrieved knowledge into prompts to eliminate hallucinations and extend model intelligence to private data.',
    order: 1,
  },

  // ── Lesson 9: Hybrid Search ──
  {
    id: 'concept-ai-hybrid-rerank',
    lessonId: 'lesson-ai-advanced-rag',
    name: 'Hybrid Search & Cross-Encoder Re-Ranking',
    summary:
      'Combines dense semantic vectors with BM25 keyword matching, refined by a cross-encoder model for optimal relevance.',
    order: 1,
  },

  // ── Lesson 10: Evals ──
  {
    id: 'concept-ai-llm-as-judge',
    lessonId: 'lesson-ai-evals-guardrails',
    name: 'Automated Evals & LLM-as-a-Judge',
    summary:
      'Benchmark model outputs against standardized scoring rubrics to catch regressions and hallucination drift.',
    order: 1,
  },

  // ── Lesson 11: Security & Caching ──
  {
    id: 'concept-ai-prompt-injection',
    lessonId: 'lesson-ai-security-cost',
    name: 'Prompt Injection & Prompt Caching',
    summary:
      'Defend against jailbreaks using delimiter framing; leverage prompt caching to cut latency and API token costs.',
    order: 1,
  },

  // ── Lesson 12: Hybrid Architecture ──
  {
    id: 'concept-ai-hybrid-coach',
    lessonId: 'lesson-ai-case-study',
    name: 'Deterministic Core + AI Augmentation',
    summary:
      'Keep core workflows (progress, SQLite, offline practice) deterministic while augmenting hints and adaptation with AI.',
    order: 1,
  },
];
