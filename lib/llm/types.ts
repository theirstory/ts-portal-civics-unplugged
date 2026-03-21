export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * A provider that can stream chat completions.
 * All providers must implement this interface.
 */
export interface LLMProvider {
  /**
   * Stream a chat completion. Yields text chunks as they arrive.
   */
  streamChat(params: { systemPrompt: string; messages: ChatMessage[]; maxTokens?: number }): AsyncIterable<string>;
}

/**
 * Supported provider identifiers.
 * "openai-compatible" covers any API that implements the OpenAI chat completions
 * format — including Ollama, vLLM, Together, Groq, etc.
 */
export type LLMProviderType = 'anthropic' | 'openai' | 'google' | 'openai-compatible';
