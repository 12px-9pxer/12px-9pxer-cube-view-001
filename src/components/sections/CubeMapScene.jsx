import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  buildCubeMapOverview,
  CUBE_MAP_LABELS,
  CUBE_MAP_STEPS,
  CUBE_MAP_UNIT,
} from "../../lib/cubeMapData.js";

const SIZE = (CUBE_MAP_STEPS - 1) * CUBE_MAP_UNIT;
const GRAPH_AXIS_ORIGIN = new THREE.Vector3(
  -CUBE_MAP_UNIT / 2,
  -CUBE_MAP_UNIT / 2,
  -CUBE_MAP_UNIT / 2,
);
const GRAPH_CENTER = new THREE.Vector3(SIZE / 2, SIZE / 2, SIZE / 2);
const INITIAL_CAMERA_OFFSET = new THREE.Vector3(108, 90, 108).sub(GRAPH_CENTER);
const DEFAULT_CAMERA_DISTANCE = 168;
const DEFAULT_CAMERA_FOV = 44;
const HOTSPOT_COLORS = ["#f25f5c", "#f3b43f", "#78d6ff"];

function outCirc(t) {
  return Math.sqrt(1 - Math.pow(Math.min(t, 1) - 1, 2));
}

function getHeatColor(count, maxCount) {
  const t = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
  return new THREE.Color().setHSL((1 - t) * 0.62, 0.82, 0.58);
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  });
}

function createLabel(text, position, className, scene, labelRefs) {
  const element = document.createElement("div");
  element.className = className;
  element.textContent = text;

  const label = new CSS2DObject(element);
  label.position.copy(position);
  scene.add(label);
  labelRefs.push({ label, element });

  return element;
}

export default function CubeMapScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const overview = buildCubeMapOverview();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050607");
    scene.fog = new THREE.FogExp2("#050607", 0.0105);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor("#050607", 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "absolute inset-0 z-0 block h-full w-full";
    renderer.domElement.setAttribute("data-cube-map-canvas", "true");
    container.appendChild(renderer.domElement);

    const cssRenderer = new CSS2DRenderer();
    cssRenderer.domElement.className = "pointer-events-none absolute inset-0 z-20";
    cssRenderer.domElement.setAttribute("data-cube-map-labels", "true");
    container.appendChild(cssRenderer.domElement);

    const camera = new THREE.PerspectiveCamera(DEFAULT_CAMERA_FOV, 1, 0.5, 2000);
    camera.position
      .copy(GRAPH_CENTER)
      .add(INITIAL_CAMERA_OFFSET.clone().normalize().multiplyScalar(DEFAULT_CAMERA_DISTANCE));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.panSpeed = 0.65;
    controls.rotateSpeed = 0.55;
    controls.target.copy(GRAPH_CENTER);
    controls.update();

    let targetZoomDistance = camera.position.distanceTo(controls.target);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const outlinePass = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
    outlinePass.edgeStrength = 4.4;
    outlinePass.edgeGlow = 0.42;
    outlinePass.edgeThickness = 1.45;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set("#d7e6ff");
    outlinePass.hiddenEdgeColor.set("#d7e6ff");
    composer.addPass(outlinePass);
    composer.addPass(new ShaderPass(GammaCorrectionShader));

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    [
      [2.2, 3.4, 2.1, 0.78],
      [-2, 1.4, -2.6, 0.32],
      [0.2, -2, 1.2, 0.2],
    ].forEach(([x, y, z, intensity]) => {
      const light = new THREE.DirectionalLight(0xffffff, intensity);
      light.position.set(x, y, z);
      scene.add(light);
    });

    const floorGrid = new THREE.GridHelper(
      CUBE_MAP_UNIT * CUBE_MAP_STEPS,
      CUBE_MAP_STEPS,
      0x385063,
      0x1f2d38,
    );
    floorGrid.position.set(SIZE / 2, -CUBE_MAP_UNIT / 2, SIZE / 2);
    scene.add(floorGrid);

    const axisOrigin = GRAPH_AXIS_ORIGIN.x;
    const axisEnd = SIZE + CUBE_MAP_UNIT / 2;

    const addAxis = (color, from, to) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...from),
        new THREE.Vector3(...to),
      ]);
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
      });
      scene.add(new THREE.Line(geometry, material));
    };

    addAxis(0xf25f5c, [axisOrigin, axisOrigin, axisOrigin], [axisEnd, axisOrigin, axisOrigin]);
    addAxis(0x68d391, [axisOrigin, axisOrigin, axisOrigin], [axisOrigin, axisEnd, axisOrigin]);
    addAxis(0x8aa4ff, [axisOrigin, axisOrigin, axisOrigin], [axisOrigin, axisOrigin, axisEnd]);

    const tickElements = { x: [], y: [], z: [] };
    const labelRefs = [];
    const labelRaycaster = new THREE.Raycaster();
    const scratchVector = new THREE.Vector3();
    let occlusionTick = 0;

    for (let i = 0; i < CUBE_MAP_STEPS; i += 1) {
      const value = i * CUBE_MAP_UNIT;
      tickElements.x.push(
        createLabel(
          CUBE_MAP_LABELS.x[i],
          new THREE.Vector3(value, axisOrigin - 5, axisOrigin - 3),
          "cube-map-label-tick",
          scene,
          labelRefs,
        ),
      );
      tickElements.y.push(
        createLabel(
          CUBE_MAP_LABELS.y[i],
          new THREE.Vector3(axisOrigin - 7, value, axisOrigin - 3),
          "cube-map-label-tick",
          scene,
          labelRefs,
        ),
      );
      tickElements.z.push(
        createLabel(
          CUBE_MAP_LABELS.z[i],
          new THREE.Vector3(axisOrigin - 3, axisOrigin - 5, value),
          "cube-map-label-tick",
          scene,
          labelRefs,
        ),
      );
    }

    const xAxisLabel = createLabel(
      "차량 기능",
      new THREE.Vector3(axisEnd + 10, axisOrigin, axisOrigin),
      "cube-map-label-axis cube-map-label-axis-x",
      scene,
      labelRefs,
    );
    const yAxisLabel = createLabel(
      "Hardware",
      new THREE.Vector3(axisOrigin, axisEnd + 10, axisOrigin),
      "cube-map-label-axis cube-map-label-axis-y",
      scene,
      labelRefs,
    );
    const zAxisLabel = createLabel(
      "사용 상황",
      new THREE.Vector3(axisOrigin, axisOrigin, axisEnd + 10),
      "cube-map-label-axis cube-map-label-axis-z",
      scene,
      labelRefs,
    );
    xAxisLabel.style.color = "#f25f5c";
    yAxisLabel.style.color = "#68d391";
    zAxisLabel.style.color = "#8aa4ff";

    const nodesGroup = new THREE.Group();
    const hotspotGroup = new THREE.Group();
    scene.add(nodesGroup);
    scene.add(hotspotGroup);

    const nodeGeometry = new RoundedBoxGeometry(CUBE_MAP_UNIT, CUBE_MAP_UNIT, CUBE_MAP_UNIT, 2, 0.45);
    const now = performance.now();

    overview.nodes.forEach((node, index) => {
      const material = new THREE.MeshPhongMaterial({
        color: getHeatColor(node.count, overview.maxCount),
        shininess: 32,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(node.x * CUBE_MAP_UNIT, node.y * CUBE_MAP_UNIT, node.z * CUBE_MAP_UNIT);
      mesh.scale.setScalar(0);
      mesh.userData = {
        ...node,
        enterStart: now + 220 + Math.min(index * 24, 540),
        enterDuration: 520,
      };
      nodesGroup.add(mesh);
    });

    overview.hotspots.forEach((node, index) => {
      const color = new THREE.Color(HOTSPOT_COLORS[index % HOTSPOT_COLORS.length]);
      const angle = index * 2.3999632;
      const radius = CUBE_MAP_UNIT * 2.35;
      const anchor = new THREE.Vector3(
        node.x * CUBE_MAP_UNIT,
        node.y * CUBE_MAP_UNIT,
        node.z * CUBE_MAP_UNIT,
      );
      const labelPoint = new THREE.Vector3(
        anchor.x + Math.cos(angle) * radius,
        anchor.y + CUBE_MAP_UNIT * (2.15 + (index % 3) * 0.45),
        anchor.z + Math.sin(angle) * radius,
      );
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        anchor.clone().add(new THREE.Vector3(0, CUBE_MAP_UNIT * 0.5, 0)),
        labelPoint,
      ]);
      const line = new THREE.Line(
        lineGeometry,
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.42,
        }),
      );
      hotspotGroup.add(line);

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(CUBE_MAP_UNIT * 0.72, 24, 16),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.12,
          side: THREE.BackSide,
        }),
      );
      sphere.position.copy(anchor);
      sphere.userData = { pulse: true, phase: index * Math.PI * 0.7 };
      hotspotGroup.add(sphere);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-9999, -9999);
    let hovered = null;

    const clearTickHighlight = () => {
      [...tickElements.x, ...tickElements.y, ...tickElements.z].forEach((element) => {
        element.classList.remove("active");
      });
    };

    const highlightTicks = (x, y, z) => {
      tickElements.x.forEach((element, index) => element.classList.toggle("active", index === x));
      tickElements.y.forEach((element, index) => element.classList.toggle("active", index === y));
      tickElements.z.forEach((element, index) => element.classList.toggle("active", index === z));
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      cssRenderer.setSize(width, height);
      composer.setSize(width, height);
      outlinePass.setSize(width, height);
    };

    const updatePointer = (event) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const clearPointer = () => {
      pointer.set(-9999, -9999);
      hovered = null;
      outlinePass.selectedObjects = [];
      clearTickHighlight();
      container.style.cursor = "default";
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1.1 : 1 / 1.1;
      targetZoomDistance = Math.max(86, Math.min(360, targetZoomDistance * factor));
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    requestAnimationFrame(resize);

    container.addEventListener("pointermove", updatePointer);
    container.addEventListener("pointerleave", clearPointer);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

    let animationFrame = 0;
    let disposed = false;

    const render = () => {
      if (disposed) {
        return;
      }

      animationFrame = requestAnimationFrame(render);
      controls.update();

      const currentDistance = camera.position.distanceTo(controls.target);
      const zoomDiff = targetZoomDistance - currentDistance;
      if (Math.abs(zoomDiff) > 0.05) {
        const direction = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target).addScaledVector(direction, currentDistance + zoomDiff * 0.1);
      }

      const frameTime = performance.now();
      nodesGroup.children.forEach((mesh) => {
        const elapsed = frameTime - mesh.userData.enterStart;
        if (elapsed < 0) {
          mesh.scale.setScalar(0);
        } else if (elapsed < mesh.userData.enterDuration) {
          mesh.scale.setScalar(outCirc(elapsed / mesh.userData.enterDuration));
        } else {
          mesh.scale.setScalar(1);
        }
      });

      const pulseTime = Date.now() * 0.0022;
      hotspotGroup.children.forEach((child) => {
        if (!child.userData.pulse) {
          return;
        }

        const pulse = Math.sin(pulseTime + child.userData.phase);
        child.scale.setScalar(0.88 + pulse * 0.14);
        child.material.opacity = 0.075 + pulse * 0.04;
      });

      occlusionTick += 1;
      if (occlusionTick % 4 === 0) {
        labelRefs.forEach(({ label, element }) => {
          const distance = camera.position.distanceTo(label.position);
          scratchVector.copy(label.position).sub(camera.position).normalize();
          labelRaycaster.set(camera.position, scratchVector);
          const hits = labelRaycaster.intersectObjects(nodesGroup.children, false);
          element.style.opacity = hits.length > 0 && hits[0].distance < distance - 0.8 ? "0.12" : "";
        });
      }

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(nodesGroup.children, false);
      if (hits.length > 0) {
        const mesh = hits[0].object;
        if (hovered !== mesh) {
          hovered = mesh;
          outlinePass.selectedObjects = [mesh];
          highlightTicks(mesh.userData.x, mesh.userData.y, mesh.userData.z);
          container.style.cursor = "pointer";
        }
      } else if (hovered) {
        hovered = null;
        outlinePass.selectedObjects = [];
        clearTickHighlight();
        container.style.cursor = "default";
      }

      composer.render();
      cssRenderer.render(scene, camera);
    };

    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", updatePointer);
      container.removeEventListener("pointerleave", clearPointer);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      controls.dispose();
      composer.dispose?.();
      outlinePass.dispose?.();
      disposeObject(scene);
      nodeGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cssRenderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden bg-[#050607]"
      data-layer-name="Cube Map 3D Scene"
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_48%_42%,rgba(82,126,158,0.22),rgba(5,6,7,0)_38%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(5,6,7,0)_34%,rgba(0,0,0,0.42)_100%)]" />
      <style>
        {`
          .cube-map-label-tick {
            color: rgba(255, 255, 255, 0.48);
            font-family: Pretendard, system-ui, sans-serif;
            font-size: 10px;
            font-weight: 600;
            line-height: 1;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.58);
            transition: color 160ms ease, opacity 180ms ease, transform 160ms ease;
            user-select: none;
            white-space: nowrap;
          }

          .cube-map-label-tick.active {
            color: rgba(255, 255, 255, 0.98);
            transform: translateY(-1px) scale(1.06);
          }

          .cube-map-label-axis {
            border: 1px solid currentColor;
            border-radius: 6px;
            background: rgba(5, 8, 12, 0.52);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
            font-family: Pretendard, system-ui, sans-serif;
            font-size: 11px;
            font-weight: 800;
            line-height: 1;
            padding: 4px 8px;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.48);
            user-select: none;
            white-space: nowrap;
          }
        `}
      </style>
    </div>
  );
}
