import * as THREE from 'three';

const NEUTRAL_GRAY = '#888888';

/**
 * Creates a ground floor plane rotated to lie flat on the XZ plane.
 */
export function createFloor(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(10, 10);
  const material = new THREE.MeshStandardMaterial({
    color: NEUTRAL_GRAY,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = 'Floor';
  mesh.userData.objectType = 'floor';
  return mesh;
}

/**
 * Creates a thin, tall wall panel.
 */
export function createWall(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(4, 3, 0.1);
  const material = new THREE.MeshStandardMaterial({ color: NEUTRAL_GRAY });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 1.5;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'Wall';
  mesh.userData.objectType = 'wall';
  return mesh;
}

/**
 * Creates a table as a composite of a tabletop and four legs.
 */
export function createTable(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Table';
  group.userData.objectType = 'table';

  const material = new THREE.MeshStandardMaterial({ color: NEUTRAL_GRAY });

  // Tabletop
  const topGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.8);
  const top = new THREE.Mesh(topGeometry, material);
  top.position.y = 0.75;
  top.castShadow = true;
  group.add(top);

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.05, 0.75, 0.05);
  const legPositions = [
    [-0.55, 0.375, -0.35],
    [0.55, 0.375, -0.35],
    [-0.55, 0.375, 0.35],
    [0.55, 0.375, 0.35],
  ];

  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  }

  return group;
}

/**
 * Creates a simple chair as a composite group.
 */
export function createChair(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Chair';
  group.userData.objectType = 'chair';

  const material = new THREE.MeshStandardMaterial({ color: NEUTRAL_GRAY });

  // Seat
  const seatGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.5);
  const seat = new THREE.Mesh(seatGeometry, material);
  seat.position.y = 0.45;
  seat.castShadow = true;
  group.add(seat);

  // Backrest
  const backGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.05);
  const back = new THREE.Mesh(backGeometry, material);
  back.position.set(0, 0.7, -0.225);
  back.castShadow = true;
  group.add(back);

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.04, 0.45, 0.04);
  const legPositions = [
    [-0.2, 0.225, -0.2],
    [0.2, 0.225, -0.2],
    [-0.2, 0.225, 0.2],
    [0.2, 0.225, 0.2],
  ];

  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  }

  return group;
}
