import type { Lesson } from '@/types/learning';

// ── Lesson 7: Embeddings & Vector Search ───────────────────────────────────────
export const embeddingsLesson: Lesson = {
  id: 'lesson-ai-embeddings',
  topicId: 'topic-ai-rag',
  title: 'Embeddings & Vector Search',
  description:
    'Convert text into high-dimensional semantic vectors and compute similarity using Cosine Similarity, Dot Product, and Euclidean Distance.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 7,
  prerequisites: ['lesson-ai-llm-apis'],
  content: [
    { type: 'heading', content: 'What are Text Embeddings?' },
    {
      type: 'text',
      content:
        'An embedding model converts a string of text into an array of floating-point numbers (e.g. 1536 dimensions for `text-embedding-3-small`). Words and concepts with similar semantic meanings are positioned close to each other in vector space, enabling semantic search that transcends exact keyword matches.',
    },
    { type: 'heading', content: 'Cosine Similarity in TypeScript' },
    {
      type: 'code',
      language: 'typescript',
      content: `// Compute cosine similarity between two float vectors (-1.0 to 1.0)
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have identical dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}`,
    },
  ],
};

// ── Lesson 8: Retrieval-Augmented Generation (RAG) Pipeline ────────────────────
export const ragPipelineLesson: Lesson = {
  id: 'lesson-ai-rag-pipeline',
  topicId: 'topic-ai-rag',
  title: 'The Retrieval-Augmented Generation (RAG) Pipeline',
  description:
    'Overcome model knowledge cutoffs and hallucinations: Chunking, Vector Storage (pgvector/Pinecone), and Grounded Context Injection.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 32,
  order: 8,
  prerequisites: ['lesson-ai-embeddings'],
  content: [
    { type: 'heading', content: 'The 4 Stages of RAG' },
    {
      type: 'text',
      content:
        '1. **Ingestion & Chunking**: Break large documents into semantic chunks (e.g. 500 tokens with 50-token overlap).\n2. **Embedding**: Generate vectors for all chunks and persist them in a vector database.\n3. **Retrieval**: When user asks a question, embed the query and fetch top-K most similar chunks.\n4. **Augmented Generation**: Inject retrieved chunks into the prompt as verified reference context.',
    },
    { type: 'heading', content: 'RAG Prompt Construction' },
    {
      type: 'code',
      language: 'typescript',
      content: `export function buildRagPrompt(userQuery: string, relevantPassages: string[]): string {
  const contextBlock = relevantPassages
    .map((p, idx) => \`[Document \${idx + 1}]:\\n\${p}\`)
    .join('\\n\\n');

  return \`You are an assistant answering questions based strictly on the provided context.
If the answer cannot be found in the context, say "I do not have enough information."

CONTEXT:
\${contextBlock}

USER QUESTION:
\${userQuery}

ANSWER:\`;
}`,
    },
  ],
};

// ── Lesson 9: Advanced RAG: Hybrid Search & Re-ranking ─────────────────────────
export const advancedRagLesson: Lesson = {
  id: 'lesson-ai-advanced-rag',
  topicId: 'topic-ai-rag',
  title: 'Advanced RAG: Hybrid Search & Re-ranking',
  description:
    'Combine dense semantic search with sparse keyword search (BM25) and apply cross-encoder re-ranking for ultra-precise retrieval.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 9,
  prerequisites: ['lesson-ai-rag-pipeline'],
  content: [
    { type: 'heading', content: 'Dense vs Sparse (Keyword) Search' },
    {
      type: 'text',
      content:
        '- **Dense (Semantic) Search**: Finds conceptual matches even with zero matching words (e.g. "car" matches "automobile"). Struggles with exact SKU numbers, variable names, or UUIDs.\n- **Sparse (BM25 / Keyword) Search**: Finds exact term occurrences. Perfect for specific identifiers.\n- **Hybrid Search + Reciprocal Rank Fusion (RRF)**: Merges scores from both algorithms to get the best of both worlds.',
    },
    { type: 'heading', content: 'Cross-Encoder Re-Ranking' },
    {
      type: 'text',
      content:
        'Vector search quickly retrieves the top 50 candidates. A slower, highly accurate **Cross-Encoder Re-Ranker** (e.g. Cohere Rerank / BGE) then scores the exact relevance of each candidate against the query, passing only the top 3–5 highest-scoring passages to the LLM.',
    },
  ],
};
