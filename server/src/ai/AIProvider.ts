export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIMessageInput {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string; // required when role === 'tool'
  name?: string;
}

export interface AICompletionResult {
  content: string | null;
  toolCalls: AIToolCall[];
  promptTokens: number;
  completionTokens: number;
  model: string;
}

export interface AICompletionParams {
  messages: AIMessageInput[];
  tools?: AIToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

// Every AI feature in the product (scoring, forecasting, email generation,
// summaries, conversation analysis, the chat assistant) talks to THIS
// interface only. Swapping OPENAI/ANTHROPIC/GOOGLE never touches a route,
// controller, or service outside src/ai/.
export interface AIProvider {
  readonly name: string;
  complete(params: AICompletionParams): Promise<AICompletionResult>;
}

export class AIUnavailableError extends Error {
  constructor(message = 'AI service is temporarily unavailable. Please try again later.') {
    super(message);
    this.name = 'AIUnavailableError';
  }
}
