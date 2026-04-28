import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { MODELS } from '@/lib/config/models';

const generatePromptSchema = z.object({
  category: z.enum(['book', 'screenplay', 'thesis', 'journal', 'educational', 'article', 'social_media']),
  answers: z.object({
    title: z.string().min(1),
    targetAudience: z.string().min(1),
    tone: z.string().min(1),
  }).passthrough(),
  brainstormHistory: z.array(z.object({
    role: z.string(),
    content: z.string()
  })).optional(),
});

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey,
  defaultHeaders: {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'X-Title': 'Agentic Author',
  },
});

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const result = generatePromptSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
    }

    const { category, answers, brainstormHistory } = result.data;

    const systemPrompt = `You are an expert content strategist and prompt engineer.
The user has answered a structured questionnaire about a content project they want to create, and may have had an AI brainstorming session to flesh out the details.
Using all the answers provided and the brainstorming context, generate a comprehensive master prompt that will guide a team of AI writing agents to produce exactly the content the user described.

OUTPUT CONTRACT:
- Return a single continuous prose text of 300-500 words.
- This is NOT JSON. Return only the master prompt text.
- Do NOT include any preamble, explanation, or conversational filler.
- Your output must be a direct instruction to a skilled writer.

REQUIREMENTS:
The master prompt MUST include:
- The exact content type and category (${category}).
- The complete audience description.
- The tone and style requirements.
- The scope and structural expectations.
- Any domain-specific constraints (citations, format, etc.).
- The cultural or geographical context.
- Explicit guidance on what the content must achieve for its reader.

For academic categories, it must include the research question. 
For narrative categories, it must establish the protagonist, conflict, and desired emotional effect. 
For educational categories, it must state measurable learning outcomes.`;

    // Format user prompt
    let userPromptContent = `Project Category: ${category}\n\n`;
    const standardKeys = ['title', 'genre', 'targetAudience', 'ageGroup', 'educationLevel', 'tone', 'style', 'length', 'chapterCount', 'depth', 'geographicalContext', 'language', 'constraints', 'additionalNotes'];
    
    for (const key of standardKeys) {
      const value = answers[key];
      if (value) {
        if (Array.isArray(value)) {
          if (value.length > 0) userPromptContent += `${key}: ${value.join(', ')}\n`;
        } else {
          userPromptContent += `${key}: ${value}\n`;
        }
      }
    }

    if (brainstormHistory && brainstormHistory.length > 0) {
      userPromptContent += '\nAI Brainstorming Session Transcript:\n';
      for (const msg of brainstormHistory) {
        userPromptContent += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
      }
    }

    const response = await openrouter.chat.completions.create({
      model: MODELS.PROMPT_WRITER,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptContent },
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ generatedPrompt: response.choices[0]?.message?.content?.trim() });
    
  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
