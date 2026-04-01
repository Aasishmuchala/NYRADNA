import * as THREE from 'three';

/**
 * Renders a normal map of the scene by overriding all materials with MeshNormalMaterial.
 * Returns the rendered normal image as a PNG Blob.
 */
export async function exportNormalMap(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
): Promise<Blob> {
  const originalOverrideMaterial = scene.overrideMaterial;
  const originalBackground = scene.background;

  const normalMaterial = new THREE.MeshNormalMaterial();

  scene.overrideMaterial = normalMaterial;
  scene.background = new THREE.Color(0x7f7fff); // neutral normal map blue

  renderer.render(scene, camera);

  const blob = await canvasToBlob(renderer.domElement);

  // Restore originals
  scene.overrideMaterial = originalOverrideMaterial;
  scene.background = originalBackground;
  normalMaterial.dispose();

  return blob;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from normal canvas'));
      },
      'image/png',
    );
  });
}
