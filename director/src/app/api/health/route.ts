import { NextResponse } from 'next/server';

export async function GET() {
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN !== 'r8_your_token_here';
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  return NextResponse.json({
    status: 'ok',
    services: {
      replicate: hasReplicate,
      openrouter: hasOpenRouter,
    },
  });
}
