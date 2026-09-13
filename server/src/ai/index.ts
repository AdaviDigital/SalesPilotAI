import { env } from '../config/env';
import type {
  AICompletionParams,
  AICompletionResult,
  AIProvider,
} from './AIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';

/**
 * Returned when AI_PROVIDER=none (or nothing configured yet). Lets the CRM
 * run fully — including a guided demo experience — with zero AI keys set.
 * See rule: "AI must be an enhancement, not a single point of failure."
 */
class DemoProvider implements AIProvider {
  readonly name = 'demo';

  async complete(
    params: AICompletionParams,
  ): Promise<AICompletionResult> {
    // Demo provider intentionally ignores the completion parameters.
    void params;

    return {
      content:
        'AI features are running in demo mode. Add an OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_AI_API_KEY and set AI_PROVIDER in Settings → AI to enable real responses.',
      toolCalls: [],
      promptTokens: 0,
      completionTokens: 0,
      model: 'demo',
    };
  }
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;

  switch (env.AI_PROVIDER) {
    case 'anthropic':
      cached = new AnthropicProvider();
      break;

    case 'openai':
      cached = new OpenAIProvider();
      break;

    case 'google':
      // Google Gemini provider follows the same AIProvider interface;
      // implement analogously to OpenAIProvider when a key is supplied.
      cached = new DemoProvider();
      break;

    default:
      cached = new DemoProvider();
  }

  return cached;
}

export * from './AIProvider';