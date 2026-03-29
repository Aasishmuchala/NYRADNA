// ─── Visual Drift Detection ─────────────────────────────────────────
// Detects when consecutive video clips drift too far from each other
// by comparing their visual prompts semantically. Uses frame extraction
// and prompt-based similarity to decide if a retry is needed.

const DRIFT_THRESHOLD = 0.55; // Below this similarity score → retry
const MAX_DRIFT_RETRIES = 2;

interface DriftCheckResult {
  similarity: number;
  drifted: boolean;
  reason?: string;
}

/**
 * Compare two prompts/descriptions for semantic similarity.
 * Uses the Ruflo MCP embeddings_compare endpoint via server API.
 * Falls back to basic keyword overlap if Ruflo is unavailable.
 */
export async function checkVisualDrift(
  previousDescription: string,
  currentDescription: string,
): Promise<DriftCheckResult> {
  if (!previousDescription || !currentDescription) {
    return { similarity: 1.0, drifted: false };
  }

  try {
    // Try Ruflo embeddings comparison via server endpoint
    const res = await fetch('/api/drift-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text1: previousDescription,
        text2: currentDescription,
      }),
    });

    if (res.ok) {
      const { similarity } = await res.json();
      return {
        similarity,
        drifted: similarity < DRIFT_THRESHOLD,
        reason: similarity < DRIFT_THRESHOLD
          ? `Visual similarity ${(similarity * 100).toFixed(0)}% below threshold ${(DRIFT_THRESHOLD * 100).toFixed(0)}%`
          : undefined,
      };
    }
  } catch {
    // Ruflo unavailable — fall back to keyword overlap
  }

  // Fallback: Jaccard similarity on keywords
  const extractKeywords = (text: string) => {
    const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'is', 'are', 'was', 'were']);
    return new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
    );
  };

  const kw1 = extractKeywords(previousDescription);
  const kw2 = extractKeywords(currentDescription);
  const intersection = new Set([...kw1].filter(x => kw2.has(x)));
  const union = new Set([...kw1, ...kw2]);
  const jaccard = union.size > 0 ? intersection.size / union.size : 0;

  return {
    similarity: jaccard,
    drifted: jaccard < DRIFT_THRESHOLD * 0.7, // Lower threshold for keyword fallback
    reason: jaccard < DRIFT_THRESHOLD * 0.7
      ? `Keyword overlap ${(jaccard * 100).toFixed(0)}% below threshold`
      : undefined,
  };
}

export { DRIFT_THRESHOLD, MAX_DRIFT_RETRIES };
export type { DriftCheckResult };
