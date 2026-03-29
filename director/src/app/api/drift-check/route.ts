import { NextRequest, NextResponse } from 'next/server';

/**
 * Visual drift check endpoint.
 * Compares two text descriptions for semantic similarity.
 * In production, this would use Ruflo MCP embeddings_compare.
 * Falls back to a basic TF-IDF cosine similarity.
 */
export async function POST(req: NextRequest) {
  try {
    const { text1, text2 } = await req.json();

    if (!text1 || !text2) {
      return NextResponse.json(
        { error: 'Both text1 and text2 are required' },
        { status: 400 }
      );
    }

    // TF-IDF cosine similarity for visual prompt comparison
    const similarity = computeCosineSimilarity(text1, text2);

    return NextResponse.json({ similarity });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Drift check failed';
    console.error(`[/api/drift-check] Error: ${message}`);
    return NextResponse.json(
      { error: message, similarity: null },
      { status: 500 }
    );
  }
}

function computeCosineSimilarity(text1: string, text2: string): number {
  const tokenize = (text: string): string[] => {
    const stopWords = new Set([
      'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
      'these', 'those', 'it', 'its', 'from', 'by', 'as', 'but', 'not',
    ]);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  };

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  // Build term frequency maps
  const tf1 = new Map<string, number>();
  const tf2 = new Map<string, number>();

  for (const t of tokens1) tf1.set(t, (tf1.get(t) || 0) + 1);
  for (const t of tokens2) tf2.set(t, (tf2.get(t) || 0) + 1);

  // All unique terms
  const allTerms = new Set([...tf1.keys(), ...tf2.keys()]);

  // Compute cosine similarity
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const term of allTerms) {
    const v1 = tf1.get(term) || 0;
    const v2 = tf2.get(term) || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}
