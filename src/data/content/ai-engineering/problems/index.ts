import type { Problem } from '@/types/learning';

export const aiEngineeringProblems: Problem[] = [
  // ── Problem 1: Temperature Selection ──
  {
    id: 'problem-ai-temperature',
    lessonId: 'lesson-ai-llm-apis',
    title: 'Temperature for Structured JSON Output',
    description: 'Select the optimal temperature for generating strictly typed JSON or code.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 1,
    prompt: 'When requesting an LLM to generate structured JSON matching a strict Zod schema, what is the best temperature setting?',
    choices: [
      'Low (e.g. 0.0 to 0.2) to minimize randomness and maximize adherence to grammar constraints',
      'High (e.g. 1.5 to 2.0) to ensure creative responses',
      'Temperature does not affect JSON generation',
      'Exactly 1.0 (default)',
    ],
    answer: 0,
    hints: [
      { id: 'hint-pai-1-1', content: 'Low temperature produces the most deterministic, predictable token probabilities.', order: 1 },
    ],
    explanation: 'Low temperature (0.0–0.2) reduces sampling randomness, resulting in consistent formatting, valid syntax, and precise schema compliance.',
  },

  // ── Problem 2: Structured Outputs ──
  {
    id: 'problem-ai-structured-guarantee',
    lessonId: 'lesson-ai-structured-outputs',
    title: 'Grammar Constrained Decoding',
    description: 'Understand how modern Structured Outputs guarantee schema adherence.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 2,
    prompt: 'How does modern LLM Structured Outputs (Constrained Decoding) guarantee 100% valid JSON adherence?',
    choices: [
      'It simply adds "Please return valid JSON" to the prompt text',
      'It masks out and disallows invalid tokens at the probability sampling step during inference based on the JSON grammar',
      'It retries the API request 10 times in a loop until it succeeds',
      'It executes JavaScript eval() on the server',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pai-2-1', content: 'The model is physically prevented from sampling invalid tokens.', order: 1 },
    ],
    explanation: 'Constrained decoding forces the LLM’s token probability distribution to zero for any token that would violate the specified JSON schema grammar.',
  },

  // ── Problem 3: Tool Calling Execution ──
  {
    id: 'problem-ai-tool-execution',
    lessonId: 'lesson-ai-tool-calling',
    title: 'Who executes tool functions?',
    description: 'Understand the separation between LLM decision making and tool execution.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 3,
    prompt: 'When an LLM triggers a tool call, where does the actual function code execute?',
    choices: [
      'Inside the LLM neural network weights',
      'On your client or server application backend environment',
      'In the LLM provider’s database',
      'Directly inside the user’s browser GPU',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pai-3-1', content: 'The LLM only emits the JSON arguments; your app runs the function.', order: 1 },
    ],
    explanation: 'The LLM only decides WHICH tool to call with WHAT parameters. Your application environment executes the actual function and feeds the observation back.',
  },

  // ── Problem 4: Cosine Similarity ──
  {
    id: 'problem-ai-cosine-metric',
    lessonId: 'lesson-ai-embeddings',
    title: 'Vector Cosine Similarity Range',
    description: 'Identify the mathematical range of cosine similarity for normalized vectors.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 4,
    prompt: 'What does a Cosine Similarity score of 1.0 between two text embeddings signify?',
    choices: [
      'The two text passages are completely unrelated (orthogonal)',
      'The two embeddings point in the exact same direction in vector space (maximum semantic similarity)',
      'An arithmetic overflow occurred',
      'The text strings have identical character lengths',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pai-4-1', content: 'Cosine of 0 degrees angle is 1.0.', order: 1 },
    ],
    explanation: 'Cosine similarity measures the cosine of the angle between two vectors. A value of 1.0 indicates identical directional orientation (highest similarity).',
  },

  // ── Problem 5: Prompt Injection ──
  {
    id: 'problem-ai-prompt-injection-def',
    lessonId: 'lesson-ai-security-cost',
    title: 'Indirect Prompt Injection Vulnerability',
    description: 'Recognize the mechanics of indirect prompt injection in RAG applications.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 5,
    prompt: 'What constitutes an "Indirect Prompt Injection" attack in an AI application?',
    choices: [
      'A user typing "reveal your password" in the chat box',
      'An attacker embedding adversarial instructions inside a third-party webpage or PDF that the AI reads during a RAG search',
      'A DDoS attack on the OpenAI servers',
      'A SQL injection attack in the sqlite database',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pai-5-1', content: 'Indirect means the malicious prompt comes from external retrieved data rather than the user prompt directly.', order: 1 },
    ],
    explanation: 'Indirect prompt injection occurs when an LLM consumes untrusted external content (e.g. via RAG or web scraping) that contains hidden adversarial instructions.',
  },

  // ── Problem 6: Hybrid AI Architecture ──
  {
    id: 'problem-ai-hybrid-architecture',
    lessonId: 'lesson-ai-case-study',
    title: 'Resilient Hybrid AI System Design',
    description: 'Identify best practices for incorporating AI into production apps.',
    type: 'true-false',
    difficulty: 'advanced',
    order: 6,
    prompt: 'True or False: In a production app like Coding Coach, core business state (progress, curriculum, test validation) should rely strictly on real-time LLM API calls rather than deterministic local databases.',
    choices: ['True', 'False'],
    answer: 1,
    hints: [
      { id: 'hint-pai-6-1', content: 'Consider offline support, API downtime, and latency.', order: 1 },
    ],
    explanation: 'False. Core business rules, progress tracking, and validation should always be deterministic (e.g. SQLite + unit test runner) so the app remains resilient, fast, and offline-capable.',
  },
];
