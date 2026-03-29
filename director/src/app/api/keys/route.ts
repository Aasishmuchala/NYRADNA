import { NextResponse } from 'next/server';

export async function GET() {
  // Only report whether providers are configured, not how or from where
  const providers = {
    replicate: {
      configured: !!process.env.REPLICATE_API_TOKEN,
    },
    openrouter: {
      configured: !!process.env.OPENROUTER_API_KEY,
    },
  };

  return NextResponse.json(providers);
}
