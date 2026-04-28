import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { MODELS } from '@/lib/config/models';

const chatSchema = z.object({
  category: z.string(),
  answers: z.any(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  suggestedFollowUps: z.array(z.string()).optional(),
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
    const result = chatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
    }

    const { category, answers, history, suggestedFollowUps } = result.data;

    let systemPrompt = `You are an expert AI brainstorming co-pilot. Your job is to help a user flesh out their idea for a ${category}.
    
Current User Inputs:
${JSON.stringify(answers, null, 2)}

Suggested follow-up areas to explore:
${suggestedFollowUps?.join('\n') || 'None'}

INSTRUCTIONS:
1. Actively guide the user's thought process. You can make relevant suggestions in line with what they've already answered.
2. Ask only ONE highly targeted follow-up question at a time. Do not overwhelm them.
3. If the user explicitly says they are done, want to proceed, or you feel you have gathered enough detailed context to craft a comprehensive master prompt, mark 'isReady' as true.
4. If 'isReady' is false, provide your next conversational 'reply'.

OUTPUT FORMAT:
Return ONLY a valid JSON object with the following structure:
{
  "isReady": boolean,
  "reply": "string"
}`;

    // Map history to ModelMessage array format expected by the SDK
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'system' ? 'system' : msg.role,
      content: msg.content
    })) as any[];

    // We add the system prompt at the beginning of the messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory
    ] as any[];

    // Initial trigger message if history is empty
    if (history.length === 0) {
      messages.push({
        role: 'user',
        content: 'Hi! Let\'s brainstorm. What else do you need to know?'
      });
    }

    const response = await openrouter.chat.completions.create({
      model: MODELS.PLANNER,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system')
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // Manually parse the JSON from the text response
    const text = response.choices[0]?.message?.content || '';
    let parsedObject;
    try {
      parsedObject = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', text);
      return NextResponse.json({ 
        isReady: false, 
        reply: "I had some trouble processing that. Could you rephrase or tell me more about your project?" 
      });
    }

    return NextResponse.json(parsedObject);
    
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
