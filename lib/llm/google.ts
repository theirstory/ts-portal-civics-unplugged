import { GoogleGenAI } from '@google/genai';
import { LLMProvider, ChatMessage } from './types';

export class GoogleProvider implements LLMProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(model?: string) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required for Google AI provider');
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = model || 'gemini-2.0-flash';
  }

  async *streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    maxTokens?: number;
  }): AsyncIterable<string> {
    // Build contents array: history + last user message
    const contents = params.messages.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    const stream = await this.client.models.generateContentStream({
      model: this.model,
      config: {
        maxOutputTokens: params.maxTokens ?? 2048,
        systemInstruction: params.systemPrompt,
      },
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }
}
