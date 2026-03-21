import { LLMProvider, LLMProviderType } from './types';
import { config } from '@/config/organizationConfig';

export type { LLMProvider, ChatMessage } from './types';

let cachedProvider: LLMProvider | null = null;

async function createAnthropicProvider(model?: string): Promise<LLMProvider> {
  const { AnthropicProvider } = await import('./anthropic');
  return new AnthropicProvider(model);
}

async function createOpenAIProvider(model?: string, baseURL?: string, apiKey?: string): Promise<LLMProvider> {
  const { OpenAIProvider } = await import('./openai');
  return new OpenAIProvider(model, baseURL, apiKey);
}

async function createGoogleProvider(model?: string): Promise<LLMProvider> {
  const { GoogleProvider } = await import('./google');
  return new GoogleProvider(model);
}

export async function getLLMProvider(): Promise<LLMProvider> {
  if (cachedProvider) return cachedProvider;

  const providerType = (config.features?.chat?.provider ?? 'anthropic') as LLMProviderType;
  const model = config.features?.chat?.model;

  switch (providerType) {
    case 'anthropic': {
      cachedProvider = await createAnthropicProvider(model);
      break;
    }
    case 'openai': {
      cachedProvider = await createOpenAIProvider(model);
      break;
    }
    case 'google': {
      cachedProvider = await createGoogleProvider(model);
      break;
    }
    case 'openai-compatible': {
      const baseURL = process.env.LLM_BASE_URL;
      const apiKey = process.env.LLM_API_KEY;
      if (!baseURL) {
        throw new Error('LLM_BASE_URL environment variable is required for openai-compatible provider');
      }
      cachedProvider = await createOpenAIProvider(model || 'default', baseURL, apiKey);
      break;
    }
    default:
      throw new Error(`Unknown LLM provider: ${providerType}. Supported: anthropic, openai, google, openai-compatible`);
  }

  return cachedProvider!;
}
