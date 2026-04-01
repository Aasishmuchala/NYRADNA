import * as THREE from 'three';

export interface CameraPreset {
  name: string;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  'Handheld Cinematic': {
    name: 'Handheld Cinematic',
    position: new THREE.Vector3(0, 1.6, 2),
    lookAt: new THREE.Vector3(0, 1, 0),
    fov: 35,
  },
  'Dolly Smooth': {
    name: 'Dolly Smooth',
    position: new THREE.Vector3(0, 1.5, 4),
    lookAt: new THREE.Vector3(0, 1, 0),
    fov: 50,
  },
  'Drone Sweep': {
    name: 'Drone Sweep',
    position: new THREE.Vector3(5, 8, 5),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 24,
  },
  'Static Frame': {
    name: 'Static Frame',
    position: new THREE.Vector3(0, 1.5, 5),
    lookAt: new THREE.Vector3(0, 1, 0),
    fov: 40,
  },
  'Gimbal Low': {
    name: 'Gimbal Low',
    position: new THREE.Vector3(1, 0.8, 3),
    lookAt: new THREE.Vector3(0, 0.8, 0),
    fov: 28,
  },
};

export function applyCameraPreset(
  camera: THREE.PerspectiveCamera,
  presetName: string,
): void {
  const preset = CAMERA_PRESETS[presetName];
  if (!preset) return;

  camera.position.copy(preset.position);
  camera.fov = preset.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(preset.lookAt);
}
