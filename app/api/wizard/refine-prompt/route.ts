import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { MODELS } from '@/lib/config/models';

const refinePromptSchema = z.object({
  category: z.enum(['book', 'screenplay', 'thesis', 'journal', 'educational', 'article', 'social_media']),
  currentPrompt: z.string().min(50).max(4000),
  userEdits: z.string().min(2).max(1000),
});

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'X-Title': 'Agentic Author',
  },
});

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const result = refinePromptSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
    }

    const { currentPrompt, userEdits } = result.data;

    const systemPrompt = `You are a professional editor and prompt engineer.
Your job is to take an existing content generation master prompt and improve it based on specific user feedback.

CRITICAL RULES:
1. Incorporate the user's feedback precisely.
2. DO NOT lose the original intent or any important details that were already established in the current prompt (like character names, specific constraints, word counts, or structural outlines) unless the user's edit explicitly overrides them.
3. OUTPUT ONLY the revised prompt text. No explanation, no preamble, no conversational filler. Your entire output will be piped directly into the system.`;

    const userPromptContent = `Current prompt:\n${currentPrompt}\n\nUser feedback to incorporate:\n${userEdits}\n\nReturn the revised prompt only.`;

    const response = await generateText({
      model: openrouter(MODELS.PROMPT_WRITER),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptContent },
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ refinedPrompt: response.text.trim() });
    
  } catch (error) {
    console.error('Error refining prompt:', error);
    return NextResponse.json(
      { error: 'Failed to refine prompt' },
      { status: 500 }
    );
  }
}
