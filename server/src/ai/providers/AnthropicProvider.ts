import { env } from '../../config/env';
import type {
  AICompletionParams,
  AICompletionResult,
  AIProvider,
  AIToolCall,
} from '../AIProvider';
import { AIUnavailableError } from '../AIProvider';

const DEFAULT_MODEL = 'claude-sonnet-4-6';

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
}

type AnthropicContentBlock =
  | AnthropicTextBlock
  | AnthropicToolUseBlock;

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  model?: string;
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';

  async complete(params: AICompletionParams): Promise<AICompletionResult> {
    if (!env.ANTHROPIC_API_KEY) {
      throw new AIUnavailableError(
        'AI provider is not configured for this organization.',
      );
    }

    const system = params.messages.find(
      (m) => m.role === 'system',
    )?.content;

    const messages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.content,
      }));

    const body: Record<string, unknown> = {
      model: DEFAULT_MODEL,
      max_tokens: params.maxTokens ?? 1024,
      system,
      messages,
    };

    if (params.tools?.length) {
      body.tools = params.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    let response: Response;

    try {
      response = await fetch(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
        },
      );
    } catch {
      throw new AIUnavailableError();
    }

    if (!response.ok) {
      throw new AIUnavailableError();
    }

    const data = (await response.json()) as AnthropicResponse;

    const content = data.content ?? [];

    const toolCalls: AIToolCall[] = content
  .filter(
    (block): block is AnthropicToolUseBlock =>
      block.type === 'tool_use'
  )
  .map((block) => ({
    id: block.id,
    name: block.name,
    arguments:
      block.input !== null &&
      typeof block.input === 'object' &&
      !Array.isArray(block.input)
        ? (block.input as Record<string, unknown>)
        : {},
  }));

    const textBlock = content.find(
      (block): block is AnthropicTextBlock =>
        block.type === 'text',
    );

    return {
      content: textBlock?.text ?? null,
      toolCalls,
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
      model: data.model ?? DEFAULT_MODEL,
    };
  }
}