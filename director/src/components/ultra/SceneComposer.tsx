'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CAMERA_PRESETS, applyCameraPreset } from './CameraPresets';
import { createMannequin, applyPose, getPosePresetNames, type PosePresetName } from './MannequinModel';
import { createFloor, createWall, createTable, createChair } from './EnvironmentPrimitives';
import { exportDepthMap } from '@/lib/ultra/depthExport';
import { exportNormalMap } from '@/lib/ultra/normalExport';
import { exportEdgeMap } from '@/lib/ultra/edgeExport';

export interface ExportedControls {
  depth: Blob;
  normal: Blob;
  edge: Blob;
}

interface SceneComposerProps {
  width?: number;
  height?: number;
  onExport?: (controls: ExportedControls) => void;
}

function SceneComposer({
  width = 800,
  height = 600,
  onExport,
}: SceneComposerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const animationIdRef = useRef<number>(0);
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);

  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [isExporting, setIsExporting] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('Handheld Cinematic');

  // ---- Initialize Three.js Scene ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 30);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 2);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // needed for toBlob exports
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xc6bfff, 0.3);
    fillLight.position.set(-3, 5, -5);
    scene.add(fillLight);

    // Ground plane
    const groundGeom = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'GroundPlane';
    scene.add(ground);

    // Grid helper
    const grid = new THREE.GridHelper(20, 20, 0x555577, 0x333355);
    grid.position.y = 0.001;
    scene.add(grid);

    // OrbitControls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.set(0, 1, 0);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.minDistance = 1;
    orbitControls.maxDistance = 20;
    orbitControls.maxPolarAngle = Math.PI / 2 + 0.1;
    orbitControlsRef.current = orbitControls;

    // TransformControls
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', (event) => {
      orbitControls.enabled = !event.value;
    });
    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;

    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Find first selectable object (has objectType in userData or parent does)
      let hitObject: THREE.Object3D | null = null;
      for (const intersect of intersects) {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj.userData.objectType) {
            hitObject = obj;
            break;
          }
          obj = obj.parent;
        }
        if (hitObject) break;
      }

      if (hitObject) {
        selectedObjectRef.current = hitObject;
        setSelectedObject(hitObject);
        transformControls.attach(hitObject);
      } else {
        selectedObjectRef.current = null;
        setSelectedObject(null);
        transformControls.detach();
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      orbitControls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      renderer.domElement.removeEventListener('click', handleClick);
      transformControls.dispose();
      orbitControls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  // ---- Update transform controls mode ----
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // ---- Camera Preset Handler ----
  const handleCameraPreset = useCallback((presetName: string) => {
    const camera = cameraRef.current;
    const orbit = orbitControlsRef.current;
    if (!camera || !orbit) return;

    applyCameraPreset(camera, presetName);
    const preset = CAMERA_PRESETS[presetName];
    if (preset) {
      orbit.target.copy(preset.lookAt);
      orbit.update();
    }
    setActivePreset(presetName);
  }, []);

  // ---- Add Object Handlers ----
  const addMannequin = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const mannequin = createMannequin();
    mannequin.position.set(0, 0, 0);
    scene.add(mannequin);
  }, []);

  const addFloor = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const floor = createFloor();
    floor.position.set(0, 0.001, 0);
    scene.add(floor);
  }, []);

  const addWall = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const wall = createWall();
    wall.position.set(0, 0, -2);
    scene.add(wall);
  }, []);

  const addTable = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const table = createTable();
    table.position.set(1, 0, 0);
    scene.add(table);
  }, []);

  const addChair = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const chair = createChair();
    chair.position.set(-1, 0, 0);
    scene.add(chair);
  }, []);

  // ---- Delete Selected Object ----
  const deleteSelected = useCallback(() => {
    const scene = sceneRef.current;
    const obj = selectedObjectRef.current;
    if (!scene || !obj) return;

    transformControlsRef.current?.detach();
    scene.remove(obj);
    selectedObjectRef.current = null;
    setSelectedObject(null);
  }, []);

  // ---- Pose Mannequin ----
  const poseMannequin = useCallback((pose: PosePresetName) => {
    const obj = selectedObjectRef.current;
    if (!obj || obj.userData.objectType !== 'mannequin') return;
    applyPose(obj as THREE.Group, pose);
    obj.userData.currentPose = pose;
  }, []);

  // ---- Export Control Maps ----
  const handleExport = useCallback(async () => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    setIsExporting(true);
    try {
      const [depth, normal, edge] = await Promise.all([
        exportDepthMap(scene, camera, renderer),
        exportNormalMap(scene, camera, renderer),
        exportEdgeMap(scene, camera, renderer),
      ]);

      const exported: ExportedControls = { depth, normal, edge };

      if (onExport) {
        onExport(exported);
      }

      // Also offer download
      downloadBlob(depth, 'depth-map.png');
      downloadBlob(normal, 'normal-map.png');
      downloadBlob(edge, 'edge-map.png');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      // Re-render normal view
      if (scene && camera && renderer) {
        renderer.render(scene, camera);
      }
    }
  }, [onExport]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        {/* Camera Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            Camera
          </span>
          {Object.keys(CAMERA_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => handleCameraPreset(name)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                activePreset === name
                  ? 'bg-[#c6bfff]/20 text-[#c6bfff] border border-[#c6bfff]/40'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-white/10 self-center" />

        {/* Add Objects */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            Add
          </span>
          {[
            { label: 'Mannequin', handler: addMannequin },
            { label: 'Floor', handler: addFloor },
            { label: 'Wall', handler: addWall },
            { label: 'Table', handler: addTable },
            { label: 'Chair', handler: addChair },
          ].map(({ label, handler }) => (
            <button
              key={label}
              onClick={handler}
              className="px-2.5 py-1 text-xs bg-white/5 text-white/70 border border-white/10 rounded-md hover:bg-white/10 transition-all"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-white/10 self-center" />

        {/* Transform Mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            Transform
          </span>
          {(['translate', 'rotate', 'scale'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTransformMode(mode)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                transformMode === mode
                  ? 'bg-[#c6bfff]/20 text-[#c6bfff] border border-[#c6bfff]/40'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
          {selectedObject && (
            <button
              onClick={deleteSelected}
              className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-all"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Pose Controls (visible when mannequin selected) */}
      {selectedObject?.userData.objectType === 'mannequin' && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            Pose
          </span>
          {getPosePresetNames().map((pose) => (
            <button
              key={pose}
              onClick={() => poseMannequin(pose)}
              className="px-2.5 py-1 text-xs bg-white/5 text-white/70 border border-white/10 rounded-md hover:bg-white/10 transition-all capitalize"
            >
              {pose}
            </button>
          ))}
        </div>
      )}

      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-white/10"
        style={{ width, height }}
      />

      {/* Export Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            isExporting
              ? 'bg-white/5 text-white/40 cursor-wait'
              : 'bg-[#c6bfff]/20 text-[#c6bfff] border border-[#c6bfff]/40 hover:bg-[#c6bfff]/30'
          }`}
        >
          {isExporting ? 'Exporting...' : 'Export Controls'}
        </button>
        <span className="text-xs text-white/40">
          Exports depth, normal, and edge maps for ControlNet conditioning
        </span>
      </div>
    </div>
  );
}

/**
 * Utility to download a blob as a file.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { SceneComposer };
export default SceneComposer;
