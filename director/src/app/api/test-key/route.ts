import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { provider } = (await req.json()) as { provider: string };

    if (!provider) {
      return NextResponse.json({ valid: false, error: 'Missing provider' });
    }

    let url: string;
    let key: string;

    switch (provider) {
      case 'replicate':
        key = process.env.REPLICATE_API_TOKEN || '';
        url = 'https://api.replicate.com/v1/account';
        break;
      case 'openrouter':
        key = process.env.OPENROUTER_API_KEY || '';
        url = 'https://openrouter.ai/api/v1/auth/key';
        break;
      default:
        return NextResponse.json({ valid: false, error: 'Unknown provider' });
    }

    if (!key) {
      return NextResponse.json({ valid: false, error: `${provider} key not configured in environment` });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` },
        signal: controller.signal,
      });
      return NextResponse.json({ valid: res.ok });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json({ valid: false, error: 'Connection failed' });
  }
}
