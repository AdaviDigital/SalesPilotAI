import { env } from '../../config/env';
import type {
  AICompletionParams,
  AICompletionResult,
  AIProvider,
  AIToolCall,
} from '../AIProvider';
import { AIUnavailableError } from '../AIProvider';

const DEFAULT_MODEL = 'gpt-4o';

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  model?: string;
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  async complete(
    params: AICompletionParams,
  ): Promise<AICompletionResult> {
    if (!env.OPENAI_API_KEY) {
      throw new AIUnavailableError(
        'AI provider is not configured for this organization.',
      );
    }

    const body: Record<string, unknown> = {
      model: DEFAULT_MODEL,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 1024,
    };

    if (params.tools?.length) {
      body.tools = params.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    let response: Response;

    try {
      response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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

    const data = (await response.json()) as OpenAIResponse;

    const choice = data.choices?.[0];

    const firstChoice = data.choices?.[0];

const toolCalls: AIToolCall[] =
  firstChoice?.message?.tool_calls?.map((toolCall) => {
    let argumentsObject: Record<string, unknown> = {};

    try {
      const parsed: unknown = JSON.parse(toolCall.function.arguments);

      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        argumentsObject = parsed as Record<string, unknown>;
      }
    } catch {
      argumentsObject = {};
    }

    return {
      id: toolCall.id,
      name: toolCall.function.name,
      arguments: argumentsObject,
    };
  }) ?? [];

    return {
      content: choice?.message?.content ?? null,
      toolCalls,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      model: data.model ?? DEFAULT_MODEL,
    };
  }
}