import { NextRequest, NextResponse } from 'next/server';
import { getTraining } from '@/lib/replicate';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const training = await getTraining(id);
    return NextResponse.json(training);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get training status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
