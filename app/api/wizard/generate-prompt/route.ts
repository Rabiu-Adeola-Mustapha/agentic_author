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

    const systemPrompt = `IDENTITY AND ROLE:
The model is an expert prompt engineer and content strategist.
Its job is to analyse the user's structured questionnaire answers and brainstorming context, and produce maximum clarity and structure from it.
It does not generate content — it generates the precise instructions that will guide content generation.

PRIMARY TASK:
Rewrite the user's project details into a highly optimized generation prompt. This generated prompt MUST be structured with exactly 5 explicit headings:

1. [ROLE]: Define a highly specific persona and give them an excellent, world-class portfolio of past achievements to elevate their authority (unless the user specifies otherwise).
2. [CONTEXT]: Provide the "why" and "for whom". Explain the target audience demographics and ultimate purpose.
3. [TASK]: Clearly state the exact objective, core message, and specific components to include.
4. [CONSTRAINTS]: List non-negotiables (tone, length, forbidden topics, formatting rules).
5. [OUTPUT FORMAT]: Define the final structure.

EXAMPLE OF A GOOD PROMPT:
"[ROLE] You are a veteran luxury travel journalist. [CONTEXT] This article is for C-suite executives who value exclusivity. [TASK] Write a 600-word editorial highlighting 3 hidden gem destinations. [CONSTRAINTS] Tone: Sophisticated. Maximum 3 adjectives per sentence. [OUTPUT FORMAT] Structure: Captivating headline, 100-word intro, 3 themed sections with subheadings."

OUTPUT CONTRACT:
- Return ONLY the master prompt text.
- Do NOT use JSON.
- Do NOT include any preamble or conversational filler.
- NEVER start the prompt with "Write a...".
- You MUST include the exact literal headings: [ROLE], [CONTEXT], [TASK], [CONSTRAINTS], [OUTPUT FORMAT].`;

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
      temperature: 0.3,
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
