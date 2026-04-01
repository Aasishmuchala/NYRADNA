import * as THREE from 'three';

/**
 * Serializable representation of a single object in the 3D scene.
 */
export interface SerializedSceneObject {
  id: string;
  type: string; // 'mannequin' | 'floor' | 'wall' | 'table' | 'chair'
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  pose?: string; // For mannequins: 'standing' | 'sitting' | 'walking' | 'gesturing'
}

/**
 * Serializable camera state.
 */
export interface SerializedCameraState {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  fov: number;
  target: { x: number; y: number; z: number };
}

/**
 * Complete serializable scene state.
 */
export interface SerializedSceneState {
  version: number;
  timestamp: number;
  camera: SerializedCameraState;
  objects: SerializedSceneObject[];
}

/**
 * Serialize a Three.js scene and camera to a JSON-friendly object.
 * Only serializes user-placed objects (those with userData.objectType).
 */
export function serializeScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  orbitTarget?: THREE.Vector3,
): SerializedSceneState {
  const objects: SerializedSceneObject[] = [];

  scene.traverse((object) => {
    if (object.userData.objectType) {
      objects.push({
        id: object.uuid,
        type: object.userData.objectType,
        name: object.name || object.userData.objectType,
        position: {
          x: object.position.x,
          y: object.position.y,
          z: object.position.z,
        },
        rotation: {
          x: object.rotation.x,
          y: object.rotation.y,
          z: object.rotation.z,
        },
        scale: {
          x: object.scale.x,
          y: object.scale.y,
          z: object.scale.z,
        },
        pose: object.userData.currentPose,
      });
    }
  });

  const target = orbitTarget ?? new THREE.Vector3(0, 1, 0);

  return {
    version: 1,
    timestamp: Date.now(),
    camera: {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z,
      },
      fov: camera.fov,
      target: { x: target.x, y: target.y, z: target.z },
    },
    objects,
  };
}

/**
 * Convert scene state to a JSON string for persistence.
 */
export function sceneStateToJSON(state: SerializedSceneState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Parse a JSON string into a scene state object.
 * Returns null if parsing fails.
 */
export function parseSceneStateJSON(json: string): SerializedSceneState | null {
  try {
    const parsed = JSON.parse(json) as SerializedSceneState;
    if (typeof parsed.version !== 'number' || !Array.isArray(parsed.objects)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Restore camera state from serialized data.
 */
export function restoreCameraState(
  camera: THREE.PerspectiveCamera,
  state: SerializedCameraState,
): void {
  camera.position.set(state.position.x, state.position.y, state.position.z);
  camera.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);
  camera.fov = state.fov;
  camera.updateProjectionMatrix();
}
