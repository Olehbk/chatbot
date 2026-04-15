import { Part } from '@google/generative-ai';
import { NextRequest } from 'next/server';
import { getGenAI, GEMINI_MODEL } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

interface MessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const messagesJson = formData.get('messages') as string | null;
    const file = formData.get('file') as File | null;

    if (!messagesJson) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages: MessagePayload[] = JSON.parse(messagesJson);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Empty messages array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gemma models don't support systemInstruction (they echo it or leak thinking output).
    // Gemini models support it fine.
    const isGemma = GEMINI_MODEL.startsWith('gemma');

    const modelConfig = isGemma
      ? { model: GEMINI_MODEL }
      : {
          model: GEMINI_MODEL,
          systemInstruction:
            'You are a helpful, friendly, and knowledgeable AI assistant. Format your responses using Markdown when it improves readability (e.g. lists, code blocks, headers). Be concise but thorough.',
        };

    const model = getGenAI().getGenerativeModel(modelConfig);

    // All messages except the last one become the chat history
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.content }] as Part[],
    }));

    const chat = model.startChat({ history });

    // Build parts for the current (last) user message
    const lastMessage = messages[messages.length - 1];
    const parts: Part[] = [{ text: lastMessage.content }];

    if (file) {
      const isTextFile =
        file.type.startsWith('text/') ||
        ['application/json', 'application/csv'].includes(file.type) ||
        /\.(txt|csv|json|md|xml|yaml|yml|toml|ini|log)$/i.test(file.name);

      if (isTextFile) {
        // Inject text files as readable content in the message
        const text = await file.text();
        parts.push({
          text: `\n\n[Attached file: ${file.name}]\n\`\`\`\n${text}\n\`\`\``,
        });
      } else {
        // Images and PDFs — send as inline binary data
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        parts.push({
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        });
      }
    }

    const result = await chat.sendMessageStream(parts);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
