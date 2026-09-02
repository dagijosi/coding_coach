import type { Challenge } from '@/types/learning';

export const aiEngineeringChallenges: Challenge[] = [
  // ── Challenge 1: Cosine Similarity Calculator ──
  {
    id: 'challenge-ai-cosine-sim',
    lessonId: 'lesson-ai-embeddings',
    title: 'Vector Cosine Similarity Calculator',
    description:
      'Write a function calculateCosineSimilarity(vecA, vecB) that calculates the cosine similarity between two numeric vectors. Return a number rounded to 4 decimal places. If lengths differ or magnitude is zero, return 0.',
    difficulty: 'medium',
    order: 1,
    functionName: 'calculateCosineSimilarity',
    starterCode: `function calculateCosineSimilarity(vecA, vecB) {
  // Return cosine similarity score between vecA and vecB (dotProduct / (normA * normB))
}`,
    testCases: [
      {
        id: 'tc-ai-cos-1',
        args: [[1, 0], [1, 0]],
        expected: 1,
      },
      {
        id: 'tc-ai-cos-2',
        args: [[1, 0], [0, 1]],
        expected: 0,
      },
      {
        id: 'tc-ai-cos-3',
        args: [[1, 2, 3], [2, 4, 6]],
        expected: 1,
      },
    ],
    hints: [
      {
        id: 'hint-ai-cos-1',
        content: 'Calculate dot product = sum(a[i] * b[i]), normA = sqrt(sum(a[i]^2)), normB = sqrt(sum(b[i]^2)).',
        order: 1,
      },
    ],
    explanation:
      'Cosine similarity is the fundamental metric used in vector databases for nearest-neighbor semantic search.',
  },

  // ── Challenge 2: Context Window Trimmer ──
  {
    id: 'challenge-ai-context-trimmer',
    lessonId: 'lesson-ai-prompt-context',
    title: 'Sliding Context Window Trimmer',
    description:
      'Write a function trimContext(messages, maxTurns) that preserves any system message at index 0 and keeps only the most recent maxTurns of non-system messages. Must return a new array.',
    difficulty: 'easy',
    order: 2,
    functionName: 'trimContext',
    starterCode: `function trimContext(messages, maxTurns) {
  // Preserve system prompt + keep only recent maxTurns messages
}`,
    testCases: [
      {
        id: 'tc-ai-trim-1',
        args: [
          [
            { role: 'system', content: 'Act as coach' },
            { role: 'user', content: 'Turn 1' },
            { role: 'assistant', content: 'Ans 1' },
            { role: 'user', content: 'Turn 2' },
            { role: 'assistant', content: 'Ans 2' },
          ],
          2,
        ],
        expected: [
          { role: 'system', content: 'Act as coach' },
          { role: 'user', content: 'Turn 2' },
          { role: 'assistant', content: 'Ans 2' },
        ],
      },
      {
        id: 'tc-ai-trim-2',
        args: [
          [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi' },
          ],
          1,
        ],
        expected: [{ role: 'assistant', content: 'Hi' }],
      },
    ],
    hints: [
      {
        id: 'hint-ai-trim-1',
        content: 'Filter messages by role === "system" vs role !== "system", slice the non-system messages with .slice(-maxTurns), and combine.',
        order: 1,
      },
    ],
    explanation:
      'Context window management keeps active token usage within budget while ensuring critical system prompts are never dropped.',
  },

  // ── Challenge 3: Tool Dispatch Router ──
  {
    id: 'challenge-ai-tool-dispatcher',
    lessonId: 'lesson-ai-tool-calling',
    title: 'Agentic Tool Call Dispatcher',
    description:
      'Write a function dispatchToolCall(registry, toolName, rawArgumentsJson) that parses the JSON string arguments, invokes the corresponding tool function from the registry, and returns { success: true, result } or { success: false, error: message } on error or missing tool.',
    difficulty: 'medium',
    order: 3,
    functionName: 'dispatchToolCall',
    starterCode: `function dispatchToolCall(registry, toolName, rawArgumentsJson) {
  // registry is an object: { [name]: (args) => any }
  // Parse rawArgumentsJson and execute matching registry function safely
}`,
    testCases: [
      {
        id: 'tc-ai-tool-1',
        args: [
          { double: (args: any) => args.num * 2 },
          'double',
          JSON.stringify({ num: 21 }),
        ],
        expected: { success: true, result: 42 },
      },
      {
        id: 'tc-ai-tool-2',
        args: [{}, 'missingTool', '{}'],
        expected: { success: false, error: 'Tool not found: missingTool' },
      },
    ],
    hints: [
      {
        id: 'hint-ai-tool-1',
        content: 'Wrap JSON.parse and tool execution in a try/catch block to handle syntax errors gracefully.',
        order: 1,
      },
    ],
    explanation:
      'A robust tool dispatcher validates and isolates tool executions so runtime errors are caught and surfaced safely back to the agent.',
  },
];
