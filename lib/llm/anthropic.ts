import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, ChatMessage } from './types';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(model?: string) {
    this.client = new Anthropic();
    this.model = model || 'claude-sonnet-4-20250514';
  }

  async *streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    maxTokens?: number;
  }): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: params.maxTokens ?? 2048,
      system: params.systemPrompt,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
