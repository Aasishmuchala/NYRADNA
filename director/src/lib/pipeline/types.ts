// ─── Pipeline Type System ───────────────────────────────────────────
//
// Defines the typed port system, node type descriptors, and config schema
// for the visual node pipeline editor. Each generation step, quality gate,
// and processing operation is a node with typed inputs and outputs.

// ─── Port Data Types ────────────────────────────────────────────────

export type PortDataType =
  | 'image'      // URL string to an image
  | 'image[]'    // Array of image URLs
  | 'video'      // URL string to a video
  | 'video[]'    // Array of video URLs
  | 'text'       // String (prompt, description)
  | 'text[]'     // Array of strings
  | 'number'     // Numeric value (score, threshold)
  | 'boolean'    // Gate pass/fail
  | 'refset'     // ReferenceImageSet object
  | 'scene'      // SceneImage object
  | 'scene[]'    // Array of SceneImage
  | 'frame'      // Extracted frame URL (alias for image, semantic distinction)
  | 'audio'      // Audio URL
  | 'any';       // Accepts anything

/** Port colors for the visual editor (hex values) */
export const PORT_COLORS: Record<PortDataType, string> = {
  'image':    '#ff9064',  // primary orange
  'image[]':  '#ff9064',
  'video':    '#81e9ff',  // tertiary blue
  'video[]':  '#81e9ff',
  'text':     '#d4c4b0',  // secondary beige
  'text[]':   '#d4c4b0',
  'number':   '#4caf50',  // success green
  'boolean':  '#9c27b0',  // processing purple
  'refset':   '#ff7941',  // primary-container orange
  'scene':    '#ffb74d',  // warm amber
  'scene[]':  '#ffb74d',
  'frame':    '#ff9064',
  'audio':    '#ce93d8',  // light purple
  'any':      '#888888',  // neutral gray
};

// ─── Port Definition ────────────────────────────────────────────────

export interface PortDef {
  id: string;               // Unique within node type, e.g. 'image_out'
  label: string;            // Display name
  dataType: PortDataType;
  required: boolean;
  default?: unknown;        // Default value if unconnected
}

// ─── Config Field Definition ────────────────────────────────────────

export interface ConfigFieldDef {
  id: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'boolean' | 'slider';
  options?: { value: string; label: string }[];
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
}

// ─── Node Category ──────────────────────────────────────────────────

export type NodeCategory = 'source' | 'generation' | 'gate' | 'processing' | 'output';

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  source: 'Source',
  generation: 'Generation',
  gate: 'Quality Gate',
  processing: 'Processing',
  output: 'Output',
};

export const CATEGORY_ICONS: Record<NodeCategory, string> = {
  source: 'input',
  generation: 'auto_awesome',
  gate: 'verified',
  processing: 'settings',
  output: 'output',
};

// ─── Execution Context ──────────────────────────────────────────────

export interface ExecutionContext {
  /** Abort signal for cancellation */
  signal: AbortSignal;
  /** Read-only access to wizard state */
  wizardState: Record<string, unknown>;
  /** Write results back to wizard state */
  updateWizardState: (partial: Record<string, unknown>) => void;
  /** Report progress for a node */
  onProgress: (nodeId: string, message: string, pct?: number) => void;
  /** Get output from a previously executed node */
  getNodeOutput: (nodeId: string, portId: string) => unknown;
}

// ─── Node Type Definition ───────────────────────────────────────────

export interface NodeTypeDef {
  /** Unique type identifier, e.g. 'ImageGen', 'FaceGate' */
  type: string;
  /** Category for palette grouping */
  category: NodeCategory;
  /** Human-readable label */
  label: string;
  /** Brief description shown in palette tooltip */
  description: string;
  /** Material Symbols icon name */
  icon: string;
  /** Input port definitions */
  inputs: PortDef[];
  /** Output port definitions */
  outputs: PortDef[];
  /** User-configurable settings */
  config: ConfigFieldDef[];
  /** If true, executes once per item in the first array input */
  forEach?: boolean;
  /** Execute function — wraps existing library code / API calls */
  execute: (
    inputs: Record<string, unknown>,
    config: Record<string, unknown>,
    ctx: ExecutionContext,
  ) => Promise<Record<string, unknown>>;
}

// ─── Type Compatibility ─────────────────────────────────────────────

/** Which output types can connect to which input types */
const ARRAY_ELEMENT: Record<string, string> = {
  'image[]': 'image',
  'video[]': 'video',
  'text[]': 'text',
  'scene[]': 'scene',
};

export function arePortsCompatible(output: PortDataType, input: PortDataType): boolean {
  // Exact match
  if (output === input) return true;
  // 'any' accepts everything
  if (input === 'any' || output === 'any') return true;
  // frame ↔ image are interchangeable
  if ((output === 'frame' && input === 'image') || (output === 'image' && input === 'frame')) return true;
  // Array element → array (single item wraps into array)
  if (ARRAY_ELEMENT[input] === output) return true;
  // Array → single element (first item unwrap)
  if (ARRAY_ELEMENT[output] === input) return true;
  return false;
}
