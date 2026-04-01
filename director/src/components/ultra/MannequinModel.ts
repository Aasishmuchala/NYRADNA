import * as THREE from 'three';

/**
 * Named pose presets for the mannequin skeleton.
 * Each maps bone names to local Euler angles (in radians).
 */
export type PosePresetName = 'standing' | 'sitting' | 'walking' | 'gesturing';

interface BoneRotation {
  x?: number;
  y?: number;
  z?: number;
}

const POSE_PRESETS: Record<PosePresetName, Record<string, BoneRotation>> = {
  standing: {},
  sitting: {
    leftUpperLeg: { x: -Math.PI / 2 },
    rightUpperLeg: { x: -Math.PI / 2 },
    leftLowerLeg: { x: Math.PI / 2 },
    rightLowerLeg: { x: Math.PI / 2 },
  },
  walking: {
    leftUpperLeg: { x: -0.4 },
    rightUpperLeg: { x: 0.4 },
    leftUpperArm: { z: 0.3 },
    rightUpperArm: { z: -0.3 },
  },
  gesturing: {
    leftUpperArm: { z: Math.PI / 2, x: -0.3 },
    leftLowerArm: { x: -0.6 },
    rightUpperArm: { z: -0.5 },
  },
};

/**
 * Skin color for the mannequin (neutral light gray).
 */
const MANNEQUIN_COLOR = '#aaaaaa';

/**
 * Helper: create a CylinderGeometry-based body segment.
 */
function createSegmentGeometry(
  radiusTop: number,
  radiusBottom: number,
  height: number,
): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8);
}

/**
 * Helper: create a BoxGeometry-based body segment.
 */
function createBoxSegmentGeometry(
  width: number,
  height: number,
  depth: number,
): THREE.BoxGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}

/**
 * Build the mannequin bone hierarchy and skinned mesh.
 * Returns a group containing the SkinnedMesh and SkeletonHelper.
 */
export function createMannequin(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Mannequin';
  group.userData.objectType = 'mannequin';

  // ---- Build Bone Hierarchy ----
  const hips = new THREE.Bone();
  hips.name = 'hips';
  hips.position.set(0, 0.9, 0);

  const spine = new THREE.Bone();
  spine.name = 'spine';
  spine.position.set(0, 0.2, 0);
  hips.add(spine);

  const chest = new THREE.Bone();
  chest.name = 'chest';
  chest.position.set(0, 0.25, 0);
  spine.add(chest);

  const neck = new THREE.Bone();
  neck.name = 'neck';
  neck.position.set(0, 0.2, 0);
  chest.add(neck);

  const head = new THREE.Bone();
  head.name = 'head';
  head.position.set(0, 0.15, 0);
  neck.add(head);

  // Arms
  const leftUpperArm = new THREE.Bone();
  leftUpperArm.name = 'leftUpperArm';
  leftUpperArm.position.set(0.2, 0.15, 0);
  chest.add(leftUpperArm);

  const leftLowerArm = new THREE.Bone();
  leftLowerArm.name = 'leftLowerArm';
  leftLowerArm.position.set(0.25, 0, 0);
  leftUpperArm.add(leftLowerArm);

  const leftHand = new THREE.Bone();
  leftHand.name = 'leftHand';
  leftHand.position.set(0.22, 0, 0);
  leftLowerArm.add(leftHand);

  const rightUpperArm = new THREE.Bone();
  rightUpperArm.name = 'rightUpperArm';
  rightUpperArm.position.set(-0.2, 0.15, 0);
  chest.add(rightUpperArm);

  const rightLowerArm = new THREE.Bone();
  rightLowerArm.name = 'rightLowerArm';
  rightLowerArm.position.set(-0.25, 0, 0);
  rightUpperArm.add(rightLowerArm);

  const rightHand = new THREE.Bone();
  rightHand.name = 'rightHand';
  rightHand.position.set(-0.22, 0, 0);
  rightLowerArm.add(rightHand);

  // Legs
  const leftUpperLeg = new THREE.Bone();
  leftUpperLeg.name = 'leftUpperLeg';
  leftUpperLeg.position.set(0.1, 0, 0);
  hips.add(leftUpperLeg);

  const leftLowerLeg = new THREE.Bone();
  leftLowerLeg.name = 'leftLowerLeg';
  leftLowerLeg.position.set(0, -0.4, 0);
  leftUpperLeg.add(leftLowerLeg);

  const leftFoot = new THREE.Bone();
  leftFoot.name = 'leftFoot';
  leftFoot.position.set(0, -0.4, 0);
  leftLowerLeg.add(leftFoot);

  const rightUpperLeg = new THREE.Bone();
  rightUpperLeg.name = 'rightUpperLeg';
  rightUpperLeg.position.set(-0.1, 0, 0);
  hips.add(rightUpperLeg);

  const rightLowerLeg = new THREE.Bone();
  rightLowerLeg.name = 'rightLowerLeg';
  rightLowerLeg.position.set(0, -0.4, 0);
  rightUpperLeg.add(rightLowerLeg);

  const rightFoot = new THREE.Bone();
  rightFoot.name = 'rightFoot';
  rightFoot.position.set(0, -0.4, 0);
  rightLowerLeg.add(rightFoot);

  // All bones for the skeleton
  const allBones = [
    hips,
    spine,
    chest,
    neck,
    head,
    leftUpperArm,
    leftLowerArm,
    leftHand,
    rightUpperArm,
    rightLowerArm,
    rightHand,
    leftUpperLeg,
    leftLowerLeg,
    leftFoot,
    rightUpperLeg,
    rightLowerLeg,
    rightFoot,
  ];

  // ---- Build a simple geometry for each body part ----
  // Instead of complex skinning, we build individual meshes
  // parented to bones for straightforward posing.

  const material = new THREE.MeshStandardMaterial({ color: MANNEQUIN_COLOR });

  // Torso (attached to spine)
  const torsoGeom = createSegmentGeometry(0.15, 0.18, 0.45);
  const torsoMesh = new THREE.Mesh(torsoGeom, material);
  torsoMesh.position.set(0, 0.12, 0);
  torsoMesh.castShadow = true;
  spine.add(torsoMesh);

  // Chest upper
  const chestGeom = createBoxSegmentGeometry(0.35, 0.2, 0.18);
  const chestMesh = new THREE.Mesh(chestGeom, material);
  chestMesh.position.set(0, 0.05, 0);
  chestMesh.castShadow = true;
  chest.add(chestMesh);

  // Head
  const headGeom = new THREE.SphereGeometry(0.1, 12, 8);
  const headMesh = new THREE.Mesh(headGeom, material);
  headMesh.position.set(0, 0.1, 0);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Neck
  const neckGeom = createSegmentGeometry(0.04, 0.05, 0.1);
  const neckMesh = new THREE.Mesh(neckGeom, material);
  neckMesh.position.set(0, 0.05, 0);
  neckMesh.castShadow = true;
  neck.add(neckMesh);

  // Left upper arm
  const upperArmGeom = createSegmentGeometry(0.04, 0.035, 0.25);
  const luaMesh = new THREE.Mesh(upperArmGeom, material);
  luaMesh.rotation.z = Math.PI / 2;
  luaMesh.position.set(0.12, 0, 0);
  luaMesh.castShadow = true;
  leftUpperArm.add(luaMesh);

  // Left lower arm
  const lowerArmGeom = createSegmentGeometry(0.035, 0.03, 0.22);
  const llaMesh = new THREE.Mesh(lowerArmGeom, material);
  llaMesh.rotation.z = Math.PI / 2;
  llaMesh.position.set(0.11, 0, 0);
  llaMesh.castShadow = true;
  leftLowerArm.add(llaMesh);

  // Right upper arm
  const ruaMesh = new THREE.Mesh(upperArmGeom, material);
  ruaMesh.rotation.z = -Math.PI / 2;
  ruaMesh.position.set(-0.12, 0, 0);
  ruaMesh.castShadow = true;
  rightUpperArm.add(ruaMesh);

  // Right lower arm
  const rlaMesh = new THREE.Mesh(lowerArmGeom, material);
  rlaMesh.rotation.z = -Math.PI / 2;
  rlaMesh.position.set(-0.11, 0, 0);
  rlaMesh.castShadow = true;
  rightLowerArm.add(rlaMesh);

  // Hips shape
  const hipsGeom = createBoxSegmentGeometry(0.28, 0.15, 0.16);
  const hipsMesh = new THREE.Mesh(hipsGeom, material);
  hipsMesh.position.set(0, 0.05, 0);
  hipsMesh.castShadow = true;
  hips.add(hipsMesh);

  // Left upper leg
  const upperLegGeom = createSegmentGeometry(0.06, 0.05, 0.4);
  const lulMesh = new THREE.Mesh(upperLegGeom, material);
  lulMesh.position.set(0, -0.2, 0);
  lulMesh.castShadow = true;
  leftUpperLeg.add(lulMesh);

  // Left lower leg
  const lowerLegGeom = createSegmentGeometry(0.05, 0.04, 0.4);
  const lllMesh = new THREE.Mesh(lowerLegGeom, material);
  lllMesh.position.set(0, -0.2, 0);
  lllMesh.castShadow = true;
  leftLowerLeg.add(lllMesh);

  // Right upper leg
  const rulMesh = new THREE.Mesh(upperLegGeom, material);
  rulMesh.position.set(0, -0.2, 0);
  rulMesh.castShadow = true;
  rightUpperLeg.add(rulMesh);

  // Right lower leg
  const rllMesh = new THREE.Mesh(lowerLegGeom, material);
  rllMesh.position.set(0, -0.2, 0);
  rllMesh.castShadow = true;
  rightLowerLeg.add(rllMesh);

  // ---- Build Skeleton ----
  const skeleton = new THREE.Skeleton(allBones);

  // ---- Skeleton Helper (visual bone display) ----
  const skeletonHelper = new THREE.SkeletonHelper(hips);
  skeletonHelper.name = 'MannequinSkeletonHelper';
  skeletonHelper.visible = true;

  group.add(hips);
  group.add(skeletonHelper);

  // Store references for posing
  group.userData.skeleton = skeleton;
  group.userData.bones = Object.fromEntries(allBones.map((b) => [b.name, b]));
  group.userData.skeletonHelper = skeletonHelper;

  return group;
}

/**
 * Apply a named pose preset to a mannequin group.
 */
export function applyPose(mannequinGroup: THREE.Group, pose: PosePresetName): void {
  const bonesMap = mannequinGroup.userData.bones as Record<string, THREE.Bone> | undefined;
  if (!bonesMap) return;

  // Reset all bones to identity
  for (const bone of Object.values(bonesMap)) {
    bone.rotation.set(0, 0, 0);
  }

  // Apply preset rotations
  const rotations = POSE_PRESETS[pose];
  for (const [boneName, rot] of Object.entries(rotations)) {
    const bone = bonesMap[boneName];
    if (bone) {
      bone.rotation.set(rot.x ?? 0, rot.y ?? 0, rot.z ?? 0);
    }
  }
}

/**
 * Returns all available pose preset names.
 */
export function getPosePresetNames(): PosePresetName[] {
  return Object.keys(POSE_PRESETS) as PosePresetName[];
}
