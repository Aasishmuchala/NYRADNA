import * as THREE from 'three';

/**
 * Renders an edge/wireframe map by extracting EdgesGeometry from all meshes
 * and drawing white edges on a black background.
 * Returns the rendered edge image as a PNG Blob.
 */
export async function exportEdgeMap(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
): Promise<Blob> {
  const originalBackground = scene.background;

  // Collect original visibility states and create edge lines
  const originals: { object: THREE.Object3D; visible: boolean }[] = [];
  const edgeGroup = new THREE.Group();
  edgeGroup.name = '__edgeExportTemp';

  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry) {
      // Create edge geometry from the mesh
      const edgesGeometry = new THREE.EdgesGeometry(object.geometry, 15);
      const lineSegments = new THREE.LineSegments(edgesGeometry, edgeMaterial);

      // Copy world transform
      object.updateWorldMatrix(true, false);
      lineSegments.applyMatrix4(object.matrixWorld);

      edgeGroup.add(lineSegments);
    }
  });

  // Hide all original objects
  scene.traverse((object) => {
    if (object !== scene && !isChildOf(object, edgeGroup)) {
      originals.push({ object, visible: object.visible });
      object.visible = false;
    }
  });

  // Add edge lines and render on black background
  scene.add(edgeGroup);
  scene.background = new THREE.Color(0x000000);

  renderer.render(scene, camera);

  const blob = await canvasToBlob(renderer.domElement);

  // Restore originals
  scene.remove(edgeGroup);
  for (const { object, visible } of originals) {
    object.visible = visible;
  }
  scene.background = originalBackground;

  // Cleanup edge geometries
  edgeGroup.traverse((child) => {
    if (child instanceof THREE.LineSegments) {
      child.geometry.dispose();
    }
  });
  edgeMaterial.dispose();

  return blob;
}

function isChildOf(object: THREE.Object3D, parent: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current === parent) return true;
    current = current.parent;
  }
  return false;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from edge canvas'));
      },
      'image/png',
    );
  });
}
