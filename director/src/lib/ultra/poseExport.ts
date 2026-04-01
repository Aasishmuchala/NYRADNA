import * as THREE from 'three';

/**
 * OpenPose-style keypoint connections for visualization.
 * Each pair defines a line between two bone indices.
 */
const POSE_CONNECTIONS: [number, number][] = [
  // Spine chain
  [0, 1], // hips -> spine
  [1, 2], // spine -> chest
  [2, 3], // chest -> neck
  [3, 4], // neck -> head
  // Left arm
  [2, 5], // chest -> leftUpperArm
  [5, 6], // leftUpperArm -> leftLowerArm
  [6, 7], // leftLowerArm -> leftHand
  // Right arm
  [2, 8], // chest -> rightUpperArm
  [8, 9], // rightUpperArm -> rightLowerArm
  [9, 10], // rightLowerArm -> rightHand
  // Left leg
  [0, 11], // hips -> leftUpperLeg
  [11, 12], // leftUpperLeg -> leftLowerLeg
  [12, 13], // leftLowerLeg -> leftFoot
  // Right leg
  [0, 14], // hips -> rightUpperLeg
  [14, 15], // rightUpperLeg -> rightLowerLeg
  [15, 16], // rightLowerLeg -> rightFoot
];

/**
 * Colors for different limb groups (OpenPose style).
 */
const LIMB_COLORS: Record<string, string> = {
  spine: '#ff0000',
  leftArm: '#00ff00',
  rightArm: '#0000ff',
  leftLeg: '#ffff00',
  rightLeg: '#ff00ff',
};

function getConnectionColor(a: number, b: number): string {
  // Spine: indices 0-4
  if (a <= 4 && b <= 4) return LIMB_COLORS.spine;
  // Left arm: 5-7
  if ((a >= 5 && a <= 7) || (b >= 5 && b <= 7)) return LIMB_COLORS.leftArm;
  // Right arm: 8-10
  if ((a >= 8 && a <= 10) || (b >= 8 && b <= 10)) return LIMB_COLORS.rightArm;
  // Left leg: 11-13
  if ((a >= 11 && a <= 13) || (b >= 11 && b <= 13)) return LIMB_COLORS.leftLeg;
  // Right leg: 14-16
  if ((a >= 14 && a <= 16) || (b >= 14 && b <= 16)) return LIMB_COLORS.rightLeg;
  return '#ffffff';
}

/**
 * Project a world-space Vector3 to 2D screen coordinates.
 */
function projectToScreen(
  point: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number,
): { x: number; y: number } {
  const projected = point.clone().project(camera);
  return {
    x: ((projected.x + 1) / 2) * width,
    y: ((-projected.y + 1) / 2) * height,
  };
}

/**
 * Renders an OpenPose-style stick figure from a skeleton's bone positions.
 * Projects 3D bone world positions to 2D and draws colored limb connections
 * on a black canvas background.
 *
 * @param bones - Array of bones (ordered matching POSE_CONNECTIONS indices)
 * @param camera - The perspective camera for projection
 * @param width - Output canvas width
 * @param height - Output canvas height
 * @returns PNG Blob of the pose visualization
 */
export async function exportPoseMap(
  bones: THREE.Bone[],
  camera: THREE.Camera,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context for pose export');

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Get world positions for each bone
  const worldPositions: THREE.Vector3[] = bones.map((bone) => {
    const pos = new THREE.Vector3();
    bone.getWorldPosition(pos);
    return pos;
  });

  // Project to screen coordinates
  const screenPoints = worldPositions.map((pos) =>
    projectToScreen(pos, camera, width, height),
  );

  // Draw connections (limb lines)
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const [a, b] of POSE_CONNECTIONS) {
    if (a >= screenPoints.length || b >= screenPoints.length) continue;
    const ptA = screenPoints[a];
    const ptB = screenPoints[b];

    ctx.strokeStyle = getConnectionColor(a, b);
    ctx.beginPath();
    ctx.moveTo(ptA.x, ptA.y);
    ctx.lineTo(ptB.x, ptB.y);
    ctx.stroke();
  }

  // Draw keypoints (joints)
  for (let i = 0; i < screenPoints.length; i++) {
    const pt = screenPoints[i];
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from pose canvas'));
      },
      'image/png',
    );
  });
}
