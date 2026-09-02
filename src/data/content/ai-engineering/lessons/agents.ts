import type { Lesson } from '@/types/learning';

// ── Lesson 4: Tool Calling & Function Execution ───────────────────────────────
export const toolCallingLesson: Lesson = {
  id: 'lesson-ai-tool-calling',
  topicId: 'topic-ai-agents',
  title: 'Tool Calling & Function Execution',
  description:
    'Equip models with external capabilities: JSON Schema tool definitions, dispatch engines, error handling, and parallel tool calling.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 4,
  prerequisites: ['lesson-ai-structured-outputs'],
  content: [
    { type: 'heading', content: 'How Tool Calling Works' },
    {
      type: 'text',
      content:
        'Tool calling does NOT mean the LLM runs code. Instead:\n1. You describe your functions to the model via JSON schemas.\n2. The model decides if a tool is needed and returns a structured tool call `{ name: "runCodeSandbox", arguments: "..." }`.\n3. Your backend executes the function in a real sandbox.\n4. You feed the result back to the model as a `tool` role message.\n5. The model synthesizes the final response.',
    },
    { type: 'heading', content: 'Tool Registry & Dispatcher in TypeScript' },
    {
      type: 'code',
      language: 'typescript',
      content: `// 1. Tool Contract
export interface ToolDefinition<TArgs = any, TResult = any> {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: TArgs) => Promise<TResult>;
}

// 2. Concrete Coding Coach Tool
export const executeCodeTool: ToolDefinition<{ code: string }> = {
  name: 'execute_javascript',
  description: 'Executes JavaScript code in an isolated sandbox and returns console logs and return value.',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'JavaScript code snippet to run' },
    },
    required: ['code'],
  },
  execute: async ({ code }) => {
    // Isolated evaluation
    try {
      const result = eval(code); // conceptually
      return { success: true, output: String(result) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};`,
    },
  ],
};

// ── Lesson 5: Agentic Workflows & ReAct Loops ──────────────────────────────────
export const reactAgentLesson: Lesson = {
  id: 'lesson-ai-react-agent',
  topicId: 'topic-ai-agents',
  title: 'Agentic Workflows & ReAct Loops',
  description:
    'Build autonomous agents with the ReAct (Reason + Act) loop: Thought -> Action -> Observation -> Final Answer.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 35,
  order: 5,
  prerequisites: ['lesson-ai-tool-calling'],
  content: [
    { type: 'heading', content: 'The ReAct Framework' },
    {
      type: 'text',
      content:
        'A single LLM call is just a prompt completion. An **Agent** is an iterative while-loop where the LLM evaluates the state, decides on an action, executes a tool, inspects the result (observation), and repeats until the objective is accomplished or a max-step limit is hit.',
    },
    { type: 'heading', content: 'Autonomous Loop Architecture' },
    {
      type: 'code',
      language: 'typescript',
      content: `export async function runAgentLoop(
  userGoal: string,
  tools: Map<string, ToolDefinition>,
  maxSteps: number = 5
): Promise<string> {
  const history: any[] = [
    { role: 'system', content: 'You are an autonomous coding assistant with access to tools.' },
    { role: 'user', content: userGoal },
  ];

  for (let step = 0; step < maxSteps; step++) {
    // 1. LLM decides next thought and action
    const response = await callLlmWithTools(history, Array.from(tools.values()));
    const message = response.choices[0].message;
    history.push(message);

    // If model returned a final answer without tools, we are done!
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content;
    }

    // 2. Execute all requested tool calls
    for (const toolCall of message.tool_calls) {
      const tool = tools.get(toolCall.function.name);
      const args = JSON.parse(toolCall.function.arguments);
      const result = tool ? await tool.execute(args) : { error: 'Unknown tool' };

      // 3. Append observation back into conversation
      history.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error('Agent exceeded maximum reasoning steps without reaching goal.');
}`,
    },
  ],
};

// ── Lesson 6: Multi-Agent Systems & State Machines ─────────────────────────────
export const multiAgentLesson: Lesson = {
  id: 'lesson-ai-multi-agent',
  topicId: 'topic-ai-agents',
  title: 'Multi-Agent Systems & State Machines',
  description:
    'Orchestrate specialized sub-agents (Planner, Coder, Critic/Reviewer) communicating through state machines and shared context.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 6,
  prerequisites: ['lesson-ai-react-agent'],
  content: [
    { type: 'heading', content: 'Why Multi-Agent Systems?' },
    {
      type: 'text',
      content:
        'A single generalist prompt loaded with 20 instructions often degrades in precision. Multi-agent systems decompose complex tasks into focused specialist roles:\n- **Planner Agent**: Breaks goals into a structured execution roadmap.\n- **Worker / Coder Agent**: Implements one specific task at a time.\n- **Reviewer / Critic Agent**: Evaluates worker output against acceptance criteria and tests before approving completion.',
    },
  ],
};
