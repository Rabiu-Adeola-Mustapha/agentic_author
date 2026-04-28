import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY}`,
      }
    });
    
    const data = await response.json();
    
    // Filter for free models to help the user identify valid IDs
    const freeModels = data.data
      ?.filter((m: any) => m.id.includes(':free'))
      .map((m: any) => ({ id: m.id, name: m.name }));

    return NextResponse.json({ 
      message: "Diagnostic check for available free models",
      count: freeModels?.length || 0,
      models: freeModels || []
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
