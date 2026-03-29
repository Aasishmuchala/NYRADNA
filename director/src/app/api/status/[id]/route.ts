import { NextRequest, NextResponse } from 'next/server';
import { getPrediction, cancelPrediction } from '@/lib/replicate';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prediction = await getPrediction(id);
    return NextResponse.json(prediction);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get prediction status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await cancelPrediction(id);
    return NextResponse.json({ cancelled: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel prediction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
