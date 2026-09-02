import type { Topic } from '@/types/learning';

export const aiEngineeringTopics: Topic[] = [
  {
    id: 'topic-ai-foundations',
    courseId: 'course-ai-engineering',
    name: 'LLM Foundations & Structured Outputs',
    description:
      'API mechanics, tokenization, temperature, system prompting, context budgeting, and strictly validated JSON schemas with Zod.',
    order: 1,
  },
  {
    id: 'topic-ai-agents',
    courseId: 'course-ai-engineering',
    name: 'Tool Calling & Autonomous Agents',
    description:
      'Function schemas, multi-step tool dispatching, ReAct execution loops (Thought-Action-Observation), and multi-agent coordination.',
    order: 2,
  },
  {
    id: 'topic-ai-rag',
    courseId: 'course-ai-engineering',
    name: 'RAG & Vector Databases',
    description:
      'Embeddings, vector distance metrics (cosine similarity), chunking strategies, vector search (pgvector/Pinecone), and hybrid re-ranking.',
    order: 3,
  },
  {
    id: 'topic-ai-production',
    courseId: 'course-ai-engineering',
    name: 'Production AI, Security & Case Study',
    description:
      'Automated evals, LLM-as-a-judge, prompt injection defense, cost/latency optimization, and augmenting Coding Coach with adaptive AI.',
    order: 4,
  },
];
