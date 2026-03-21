import OpenAI from 'openai';
import { LLMProvider, ChatMessage } from './types';

/**
 * OpenAI provider — also works as the base for any OpenAI-compatible API
 * (Ollama, vLLM, Together, Groq, etc.) via baseURL override.
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(model?: string, baseURL?: string, apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      ...(baseURL && { baseURL }),
    });
    this.model = model || 'gpt-4o';
  }

  async *streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    maxTokens?: number;
  }): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: params.maxTokens ?? 2048,
      stream: true,
      messages: [
        { role: 'system', content: params.systemPrompt },
        ...params.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  }
}
