import { getLLMProvider } from '@/lib/llm';

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  try {
    const { prompt, context } = (await request.json()) as { prompt: string; context?: string };

    if (!prompt?.trim()) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const provider = await getLLMProvider();

          const systemPrompt = `You are a helpful writing assistant integrated into a notes editor. Generate well-structured text based on the user's prompt. Follow these guidelines:
- Write in clear, well-organized prose
- Use markdown formatting where appropriate (headings, lists, bold, etc.)
- Match the tone and style implied by the user's request
- Be concise but thorough
- Do not include meta-commentary about the writing process — just produce the requested content`;

          const userMessage = context
            ? `Here is the existing note content for context:\n\n---\n${context}\n---\n\nUser request: ${prompt}`
            : prompt;

          const textStream = provider.streamChat({
            systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
            maxTokens: 4096,
          });

          for await (const text of textStream) {
            controller.enqueue(encoder.encode(sseEvent({ type: 'text', content: text })));
          }

          controller.enqueue(encoder.encode(sseEvent({ type: 'done' })));
        } catch (err) {
          console.error('AI generate error:', err);
          controller.enqueue(
            encoder.encode(sseEvent({ type: 'text', content: 'Sorry, an error occurred while generating text.' })),
          );
          controller.enqueue(encoder.encode(sseEvent({ type: 'done' })));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return Response.json({ error: 'Failed to generate text' }, { status: 500 });
  }
}
