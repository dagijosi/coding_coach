import type { Lesson } from '@/types/learning';

// ── Lesson 1: LLM APIs, Tokens & Inference Mechanics ──────────────────────────
export const llmApisLesson: Lesson = {
  id: 'lesson-ai-llm-apis',
  topicId: 'topic-ai-foundations',
  title: 'LLM APIs, Tokens & Inference Mechanics',
  description:
    'Understand chat completion APIs, tokenization (BPE), temperature, top-p, and streaming inference.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 1,
  prerequisites: [],
  content: [
    { type: 'heading', content: 'How LLM APIs Work' },
    {
      type: 'text',
      content:
        'Large Language Models are probabilistic next-token predictors. Modern chat APIs accept an array of messages with distinct roles:\n- **system**: High-priority instructions defining persona, constraints, and operational guidelines.\n- **user**: The human prompt or runtime dynamic input.\n- **assistant**: Previous model responses (for multi-turn conversation memory).\n- **tool**: The output returned by functions executed by your application.',
    },
    { type: 'heading', content: 'Inference Parameters (Temperature & Top-P)' },
    {
      type: 'text',
      content:
        '- **Temperature (0.0 to 2.0)**: Controls randomness. Low (0.0 - 0.2) is deterministic and best for structured JSON, code generation, and math. High (0.7 - 1.0) is creative for writing and brainstorming.\n- **Top-P (Nucleus Sampling)**: Selects tokens from the smallest cumulative probability pool. Keep temperature or top-p constant when tuning.',
    },
    { type: 'heading', content: 'Streaming Completions with Server-Sent Events' },
    {
      type: 'code',
      language: 'typescript',
      content: `// Conceptual typed streaming handler using modern fetch API
export async function* streamLlmResponse(prompt: string): AsyncGenerator<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are an expert TypeScript coding coach.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // Yield text tokens in real time to UI
    yield chunk;
  }
}`,
    },
  ],
};

// ── Lesson 2: Structured Outputs & Schema Enforcement ─────────────────────────
export const structuredOutputsLesson: Lesson = {
  id: 'lesson-ai-structured-outputs',
  topicId: 'topic-ai-foundations',
  title: 'Structured Outputs & Schema Enforcement',
  description:
    'Eliminate JSON parsing failures with strict schema enforcement, constrained decoding, and Zod validation.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 2,
  prerequisites: ['lesson-ai-llm-apis'],
  content: [
    { type: 'heading', content: 'The Fragility of Freeform Text' },
    {
      type: 'text',
      content:
        'When building software on top of LLMs, natural language text output is notoriously difficult to parse reliably. Models might include markdown code fences (```json), preamble comments ("Here is your JSON:"), or missing keys, causing runtime exceptions. Modern LLM engines offer **Strict Structured Outputs** that use grammar-constrained decoding at the token-generation level to guarantee 100% adherence to a JSON Schema.',
    },
    { type: 'heading', content: 'Type-Safe LLM Output with Zod' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { z } from 'zod';

// 1. Define the exact contract for an adaptive learning problem
export const GeneratedProblemSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  difficulty: z.enum(['beginner', 'easy', 'medium', 'hard']),
  codeSnippet: z.string(),
  options: z.array(z.string()).length(4),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export type GeneratedProblem = z.infer<typeof GeneratedProblemSchema>;

// 2. Call LLM with JSON schema mode and validate
export async function generateAdaptiveProblem(topic: string): Promise<GeneratedProblem> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You generate coding quiz questions. Output strictly valid JSON matching the schema.',
        },
        { role: 'user', content: \`Generate a problem testing: \${topic}\` },
      ],
    }),
  });

  const rawJson = await response.json();
  // Safe runtime validation: Throws if LLM deviates
  return GeneratedProblemSchema.parse(JSON.parse(rawJson.choices[0].message.content));
}`,
    },
  ],
};

// ── Lesson 3: Prompt Engineering & Context Management ─────────────────────────
export const promptContextLesson: Lesson = {
  id: 'lesson-ai-prompt-context',
  topicId: 'topic-ai-foundations',
  title: 'Prompt Engineering & Context Window Management',
  description:
    'Few-Shot prompting, Chain-of-Thought reasoning, token budgeting, sliding windows, and context compression.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 3,
  prerequisites: ['lesson-ai-structured-outputs'],
  content: [
    { type: 'heading', content: 'Prompt Techniques: Zero-Shot vs Few-Shot vs CoT' },
    {
      type: 'text',
      content:
        '- **Zero-Shot**: Asking the model directly without examples.\n- **Few-Shot (In-Context Learning)**: Providing 2–3 high-quality input/output pairs in the prompt. Drastically boosts accuracy and stylistic consistency.\n- **Chain-of-Thought (CoT)**: Prompting the model to *"Think step-by-step before answering"*. Allows the model to use generation tokens as a scratchpad for complex reasoning.',
    },
    { type: 'heading', content: 'Context Window Budgeting & Sliding Windows' },
    {
      type: 'text',
      content:
        'Context windows (e.g. 128k tokens) fill up quickly in long chat sessions. The model also suffers from *"Lost in the Middle"* syndrome when prompts become excessively long.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// Sliding window context trimmer preserving system prompt & recent turns
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function trimConversationContext(
  messages: Message[],
  maxRecentMessages: number = 8
): Message[] {
  const systemMessage = messages.find((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');
  const recentHistory = nonSystemMessages.slice(-maxRecentMessages);

  return systemMessage ? [systemMessage, ...recentHistory] : recentHistory;
}`,
    },
  ],
};
