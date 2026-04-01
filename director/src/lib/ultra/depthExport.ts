import * as THREE from 'three';

/**
 * Renders a depth map of the scene by overriding all materials with MeshDepthMaterial.
 * Returns the rendered depth image as a PNG Blob.
 */
export async function exportDepthMap(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
): Promise<Blob> {
  const originalOverrideMaterial = scene.overrideMaterial;
  const originalBackground = scene.background;

  // Use near/far-based depth for good contrast
  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.BasicDepthPacking,
  });

  scene.overrideMaterial = depthMaterial;
  scene.background = new THREE.Color(0xffffff);

  renderer.render(scene, camera);

  const blob = await canvasToBlob(renderer.domElement);

  // Restore originals
  scene.overrideMaterial = originalOverrideMaterial;
  scene.background = originalBackground;
  depthMaterial.dispose();

  return blob;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from depth canvas'));
      },
      'image/png',
    );
  });
}
