import { useEffect, useRef } from "react";
import gsap from "gsap";
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
import CubeHoverMessage, { CUBE_HOVER_MESSAGE_TEXT } from "./CubeHoverMessage.jsx";

const SIZE = (CUBE_MAP_STEPS - 1) * CUBE_MAP_UNIT;
const GRAPH_AXIS_ORIGIN = new THREE.Vector3(
  -CUBE_MAP_UNIT / 2,
  -CUBE_MAP_UNIT / 2,
  -CUBE_MAP_UNIT / 2,
);
const GRAPH_CENTER = new THREE.Vector3(SIZE / 2, SIZE / 2, SIZE / 2);
const INITIAL_CAMERA_OFFSET = new THREE.Vector3(108, 90, 108).sub(GRAPH_CENTER);
// Initial 3D scene distance. Increase to start farther away, decrease to start closer.
const DEFAULT_CAMERA_DISTANCE = 200;
const DEFAULT_CAMERA_FOV = 44;
const DEFAULT_CAMERA_NEAR = 0.5;
const DEFAULT_CAMERA_FAR = 2000;
const SCENE_BACKGROUND_COLOR = "#EBE9ED";
const CUBE_DISTANCE_FADE_DENSITY = 0.0018;
const CUBE_NEUTRAL_LIGHTNESS_MIN = 0.36;
const CUBE_NEUTRAL_LIGHTNESS_MAX = 0.78;
const CUBE_HOVER_SPREAD_DISTANCE = 8.2;
const CUBE_HOVER_SPREAD_FALLOFF_DISTANCE = CUBE_MAP_UNIT * 8.5;
const CUBE_HOVER_SPREAD_MIN_INFLUENCE = 0.18;
const CUBE_HOVER_SPREAD_DURATION = 1.72;
const CUBE_HOVER_RESET_DURATION = 0.52;
const CUBE_FLOATING_SHOW_DELAY_MS = 700;
const CUBE_FLOATING_HIDE_DELAY_MS = 500;
const CUBE_FLOATING_WIDTH = 285.75;
const CUBE_FLOATING_HEIGHT = 284.25;
const CUBE_FLOATING_SCALE = 0.75;
const CUBE_FLOATING_LAYOUT_WIDTH = CUBE_FLOATING_WIDTH * CUBE_FLOATING_SCALE;
const CUBE_FLOATING_LAYOUT_HEIGHT = CUBE_FLOATING_HEIGHT * CUBE_FLOATING_SCALE;
const CUBE_FLOATING_SCREEN_MARGIN = 24;
const CUBE_FLOATING_CUBE_OFFSET = 28;
const CUBE_FLOATING_VERTICAL_OFFSET = 28;
const CUBE_FLOATING_HOVER_SAFE_GAP = 64;
const CUBE_FOCUS_SCALE = 2.8;
const CUBE_FOCUS_DIM_OPACITY = 0;
const CUBE_FOCUS_GRID_OPACITY = 0;
const CUBE_FOCUS_HOTSPOT_OPACITY = 0;
const CUBE_FOCUS_FLOATING_GAP = 36;
const CUBE_FOCUS_AUTO_ROTATE_DURATION = 12;
const HOTSPOT_COLORS = ["#4a4a4a", "#666666", "#858585"];
const AXIS_COLORS = {
  x: 0x555555,
  y: 0x6b6b6b,
  z: 0x858585,
};

function outCirc(t) {
  return Math.sqrt(1 - Math.pow(Math.min(t, 1) - 1, 2));
}

function getNeutralCubeColor(count, maxCount) {
  const t = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
  const lightness =
    CUBE_NEUTRAL_LIGHTNESS_MIN +
    (CUBE_NEUTRAL_LIGHTNESS_MAX - CUBE_NEUTRAL_LIGHTNESS_MIN) * t;

  return new THREE.Color().setHSL(0, 0, lightness);
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

function collectMaterials(object) {
  const materials = new Set();

  object.traverse((child) => {
    const { material } = child;

    if (Array.isArray(material)) {
      material.forEach((entry) => materials.add(entry));
    } else if (material) {
      materials.add(material);
    }
  });

  return [...materials];
}

function tweenObjectOpacity(object, opacity, duration = 0.42) {
  collectMaterials(object).forEach((material) => {
    if (material.userData.baseOpacity === undefined) {
      material.userData.baseOpacity = material.opacity ?? 1;
    }

    material.transparent = true;
    gsap.to(material, {
      opacity,
      duration,
      ease: "power3.out",
      overwrite: "auto",
    });
  });
}

function restoreObjectOpacity(object, duration = 0.5) {
  collectMaterials(object).forEach((material) => {
    const opacity = material.userData.baseOpacity ?? 1;

    gsap.to(material, {
      opacity,
      duration,
      ease: "power3.out",
      overwrite: "auto",
    });
  });
}

export default function CubeMapScene({ onFocusChange = () => {} }) {
  const containerRef = useRef(null);
  const floatingMessageRef = useRef(null);
  const floatingPanelRef = useRef(null);
  const floatingContentRef = useRef(null);
  const floatingTextRef = useRef(null);
  const connectorLineRef = useRef(null);
  const focusBackButtonRef = useRef(null);
  const autoRotateButtonRef = useRef(null);
  const onFocusChangeRef = useRef(onFocusChange);

  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
  }, [onFocusChange]);

  useEffect(() => {
    const container = containerRef.current;
    const floatingMessage = floatingMessageRef.current;
    const floatingPanel = floatingPanelRef.current;
    const floatingContent = floatingContentRef.current;
    const floatingText = floatingTextRef.current;
    const connectorLine = connectorLineRef.current;
    const focusBackButton = focusBackButtonRef.current;
    const autoRotateButton = autoRotateButtonRef.current;

    if (
      !container ||
      !floatingMessage ||
      !floatingPanel ||
      !floatingContent ||
      !floatingText ||
      !connectorLine ||
      !focusBackButton ||
      !autoRotateButton
    ) {
      return undefined;
    }

    const overview = buildCubeMapOverview();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
    scene.fog = new THREE.FogExp2(SCENE_BACKGROUND_COLOR, CUBE_DISTANCE_FADE_DENSITY);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(SCENE_BACKGROUND_COLOR, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "absolute inset-0 z-0 block h-full w-full";
    renderer.domElement.setAttribute("data-cube-map-canvas", "true");
    container.appendChild(renderer.domElement);

    const cssRenderer = new CSS2DRenderer();
    cssRenderer.domElement.className = "pointer-events-none absolute inset-0 z-20";
    cssRenderer.domElement.setAttribute("data-cube-map-labels", "true");
    container.appendChild(cssRenderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      DEFAULT_CAMERA_FOV,
      1,
      DEFAULT_CAMERA_NEAR,
      DEFAULT_CAMERA_FAR,
    );
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
      0xa9a9ad,
      0xc9c7cb,
    );
    floorGrid.position.set(SIZE / 2, -CUBE_MAP_UNIT / 2, SIZE / 2);
    scene.add(floorGrid);

    const axisOrigin = GRAPH_AXIS_ORIGIN.x;
    const axisEnd = SIZE + CUBE_MAP_UNIT / 2;
    const axisLines = [];

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
      const line = new THREE.Line(geometry, material);
      axisLines.push(line);
      scene.add(line);
    };

    addAxis(AXIS_COLORS.x, [axisOrigin, axisOrigin, axisOrigin], [axisEnd, axisOrigin, axisOrigin]);
    addAxis(AXIS_COLORS.y, [axisOrigin, axisOrigin, axisOrigin], [axisOrigin, axisEnd, axisOrigin]);
    addAxis(AXIS_COLORS.z, [axisOrigin, axisOrigin, axisOrigin], [axisOrigin, axisOrigin, axisEnd]);

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
    xAxisLabel.style.color = "#555555";
    yAxisLabel.style.color = "#6b6b6b";
    zAxisLabel.style.color = "#858585";

    const nodesGroup = new THREE.Group();
    const hotspotGroup = new THREE.Group();
    scene.add(nodesGroup);
    scene.add(hotspotGroup);

    const nodeGeometry = new RoundedBoxGeometry(CUBE_MAP_UNIT, CUBE_MAP_UNIT, CUBE_MAP_UNIT, 2, 0.45);
    const now = performance.now();

    overview.nodes.forEach((node, index) => {
      const material = new THREE.MeshPhongMaterial({
        color: getNeutralCubeColor(node.count, overview.maxCount),
        shininess: 24,
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(node.x * CUBE_MAP_UNIT, node.y * CUBE_MAP_UNIT, node.z * CUBE_MAP_UNIT);
      mesh.scale.setScalar(0);
      mesh.userData = {
        ...node,
        basePosition: mesh.position.clone(),
        baseRotation: mesh.rotation.clone(),
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
    const spreadDirection = new THREE.Vector3();
    const projectedPosition = new THREE.Vector3();
    const focusBoundsBox = new THREE.Box3();
    const focusBoundsVector = new THREE.Vector3();
    const latestPointerLocal = { x: 0, y: 0 };
    let hovered = null;
    let floatingMesh = null;
    let pendingFloatingMesh = null;
    let floatingShowTimer = 0;
    let floatingHideTimer = 0;
    let floatingTimeline = null;
    let floatingIdleTween = null;
    let typewriterTween = null;
    let isFloatingVisible = false;
    let isFloatingHovered = false;
    let focusedMesh = null;
    let isFocusMode = false;
    let focusTimeline = null;
    let focusIdleTween = null;
    let focusRotateTween = null;
    let pressedMesh = null;
    let isAutoRotateEnabled = true;
    const floatingLayout = {
      x: 0,
      y: 0,
      cubeX: 0,
      cubeY: 0,
    };

    const quickFloatingX = gsap.quickTo(floatingMessage, "x", {
      duration: 0.36,
      ease: "power3.out",
    });
    const quickFloatingY = gsap.quickTo(floatingMessage, "y", {
      duration: 0.36,
      ease: "power3.out",
    });

    gsap.set(floatingMessage, {
      autoAlpha: 0,
      x: 0,
      y: 0,
    });
    gsap.set(floatingPanel, {
      scale: 0.94,
      y: 12,
      filter: "blur(8px)",
      transformOrigin: "50% 50%",
    });
    gsap.set(floatingContent, {
      scale: CUBE_FLOATING_SCALE,
      y: 0,
      transformOrigin: "0 0",
    });
    gsap.set(connectorLine, {
      autoAlpha: 0,
    });
    gsap.set(focusBackButton, {
      autoAlpha: 0,
      y: -6,
      pointerEvents: "none",
    });
    gsap.set(autoRotateButton, {
      autoAlpha: 0,
      y: -6,
      pointerEvents: "none",
    });
    floatingText.textContent = "";

    const tweenNodePosition = (mesh, target, duration, ease) => {
      gsap.to(mesh.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        ease,
        overwrite: "auto",
      });
    };

    const resetCubeSpread = () => {
      nodesGroup.children.forEach((mesh) => {
        tweenNodePosition(
          mesh,
          mesh.userData.basePosition,
          CUBE_HOVER_RESET_DURATION,
          "power3.out",
        );
      });
    };

    const spreadCubesFrom = (anchorMesh) => {
      const anchorPosition = anchorMesh.userData.basePosition;

      nodesGroup.children.forEach((mesh) => {
        const basePosition = mesh.userData.basePosition;

        if (mesh === anchorMesh) {
          tweenNodePosition(mesh, basePosition, CUBE_HOVER_RESET_DURATION, "power3.out");
          return;
        }

        spreadDirection.copy(basePosition).sub(anchorPosition);
        const distance = Math.max(spreadDirection.length(), 0.001);
        const influence = THREE.MathUtils.clamp(
          1 - distance / CUBE_HOVER_SPREAD_FALLOFF_DISTANCE,
          CUBE_HOVER_SPREAD_MIN_INFLUENCE,
          1,
        );
        const spreadPosition = basePosition
          .clone()
          .add(spreadDirection.normalize().multiplyScalar(CUBE_HOVER_SPREAD_DISTANCE * influence));

        tweenNodePosition(
          mesh,
          spreadPosition,
          CUBE_HOVER_SPREAD_DURATION,
          "elastic.out(1, 0.74)",
        );
      });
    };

    const clearFloatingShowTimer = () => {
      if (floatingShowTimer) {
        window.clearTimeout(floatingShowTimer);
        floatingShowTimer = 0;
      }
    };

    const clearFloatingHideTimer = () => {
      if (floatingHideTimer) {
        window.clearTimeout(floatingHideTimer);
        floatingHideTimer = 0;
      }
    };

    const getObjectScreenBounds = (object, rect) => {
      object.updateWorldMatrix(true, false);
      focusBoundsBox.setFromObject(object);

      const { min, max } = focusBoundsBox;
      const corners = [
        [min.x, min.y, min.z],
        [min.x, min.y, max.z],
        [min.x, max.y, min.z],
        [min.x, max.y, max.z],
        [max.x, min.y, min.z],
        [max.x, min.y, max.z],
        [max.x, max.y, min.z],
        [max.x, max.y, max.z],
      ];
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;

      corners.forEach(([x, y, z]) => {
        focusBoundsVector.set(x, y, z).project(camera);
        const screenX = (focusBoundsVector.x * 0.5 + 0.5) * rect.width;
        const screenY = (-focusBoundsVector.y * 0.5 + 0.5) * rect.height;
        left = Math.min(left, screenX);
        right = Math.max(right, screenX);
        top = Math.min(top, screenY);
        bottom = Math.max(bottom, screenY);
      });

      return {
        left,
        right,
        top,
        bottom,
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2,
      };
    };

    const updateFloatingPosition = (mesh, immediate = false) => {
      const rect = container.getBoundingClientRect();
      const cardWidth = CUBE_FLOATING_LAYOUT_WIDTH;
      const cardHeight = CUBE_FLOATING_LAYOUT_HEIGHT;
      const cubePosition = projectedPosition.copy(mesh.position);
      cubePosition.project(camera);

      const cubeScreenX = (cubePosition.x * 0.5 + 0.5) * rect.width;
      const cubeScreenY = (-cubePosition.y * 0.5 + 0.5) * rect.height;
      if (isFocusMode && mesh === focusedMesh) {
        const cubeBounds = getObjectScreenBounds(mesh, rect);
        const rightX = cubeBounds.right + CUBE_FOCUS_FLOATING_GAP;
        const leftX = cubeBounds.left - cardWidth - CUBE_FOCUS_FLOATING_GAP;
        const canPlaceRight = rightX + cardWidth <= rect.width - CUBE_FLOATING_SCREEN_MARGIN;
        const canPlaceLeft = leftX >= CUBE_FLOATING_SCREEN_MARGIN;
        let rawX = canPlaceRight ? rightX : leftX;
        let rawY = cubeBounds.centerY - cardHeight / 2;

        if (!canPlaceRight && !canPlaceLeft) {
          const centeredX = cubeBounds.centerX - cardWidth / 2;
          const aboveY = cubeBounds.top - cardHeight - CUBE_FOCUS_FLOATING_GAP;
          const belowY = cubeBounds.bottom + CUBE_FOCUS_FLOATING_GAP;
          rawX = centeredX;
          rawY =
            aboveY >= CUBE_FLOATING_SCREEN_MARGIN
              ? aboveY
              : belowY + cardHeight <= rect.height - CUBE_FLOATING_SCREEN_MARGIN
                ? belowY
                : rawY;
        }

        const x = THREE.MathUtils.clamp(
          rawX,
          CUBE_FLOATING_SCREEN_MARGIN,
          Math.max(CUBE_FLOATING_SCREEN_MARGIN, rect.width - cardWidth - CUBE_FLOATING_SCREEN_MARGIN),
        );
        const y = THREE.MathUtils.clamp(
          rawY,
          CUBE_FLOATING_SCREEN_MARGIN,
          Math.max(CUBE_FLOATING_SCREEN_MARGIN, rect.height - cardHeight - CUBE_FLOATING_SCREEN_MARGIN),
        );

        floatingLayout.x = x;
        floatingLayout.y = y;
        floatingLayout.cubeX = cubeBounds.centerX;
        floatingLayout.cubeY = cubeBounds.centerY;

        if (immediate) {
          gsap.set(floatingMessage, { x, y });
          return;
        }

        quickFloatingX(x);
        quickFloatingY(y);
        return;
      }

      const cubeBounds = getObjectScreenBounds(mesh, rect);
      const pointerX = latestPointerLocal.x || cubeBounds.centerX;
      const pointerY = latestPointerLocal.y || cubeBounds.centerY;
      const centeredX = cubeBounds.centerX - cardWidth / 2;
      const aboveY = Math.min(cubeBounds.top, pointerY) - cardHeight - CUBE_FLOATING_HOVER_SAFE_GAP;
      const belowY = Math.max(cubeBounds.bottom, pointerY) + CUBE_FLOATING_HOVER_SAFE_GAP;
      const rightX = Math.max(cubeBounds.right, pointerX) + CUBE_FLOATING_HOVER_SAFE_GAP;
      const leftX = Math.min(cubeBounds.left, pointerX) - cardWidth - CUBE_FLOATING_HOVER_SAFE_GAP;
      const canPlaceAbove = aboveY >= CUBE_FLOATING_SCREEN_MARGIN;
      const canPlaceRight = rightX + cardWidth <= rect.width - CUBE_FLOATING_SCREEN_MARGIN;
      const canPlaceLeft = leftX >= CUBE_FLOATING_SCREEN_MARGIN;
      const canPlaceBelow = belowY + cardHeight <= rect.height - CUBE_FLOATING_SCREEN_MARGIN;
      let rawX = centeredX;
      let rawY = aboveY;

      if (!canPlaceAbove) {
        if (canPlaceRight) {
          rawX = rightX;
          rawY = cubeBounds.centerY - cardHeight / 2;
        } else if (canPlaceLeft) {
          rawX = leftX;
          rawY = cubeBounds.centerY - cardHeight / 2;
        } else if (canPlaceBelow) {
          rawX = centeredX;
          rawY = belowY;
        } else {
          rawX = pointerX < cubeBounds.centerX ? cubeBounds.right + CUBE_FLOATING_HOVER_SAFE_GAP : leftX;
          rawY = cubeBounds.centerY - cardHeight / 2;
        }
      }

      const x = THREE.MathUtils.clamp(
        rawX,
        CUBE_FLOATING_SCREEN_MARGIN,
        Math.max(CUBE_FLOATING_SCREEN_MARGIN, rect.width - cardWidth - CUBE_FLOATING_SCREEN_MARGIN),
      );
      const y = THREE.MathUtils.clamp(
        rawY,
        CUBE_FLOATING_SCREEN_MARGIN,
        Math.max(CUBE_FLOATING_SCREEN_MARGIN, rect.height - cardHeight - CUBE_FLOATING_SCREEN_MARGIN),
      );

      floatingLayout.x = x;
      floatingLayout.y = y;
      floatingLayout.cubeX = cubeBounds.centerX;
      floatingLayout.cubeY = cubeBounds.centerY;

      if (immediate) {
        gsap.set(floatingMessage, { x, y });
        return;
      }

      quickFloatingX(x);
      quickFloatingY(y);
    };

    const getFloatingCardLayout = () => {
      const x = Number(gsap.getProperty(floatingMessage, "x")) || floatingLayout.x;
      const y = Number(gsap.getProperty(floatingMessage, "y")) || floatingLayout.y;
      const panelY = Number(gsap.getProperty(floatingPanel, "y")) || 0;
      const idleY = Number(gsap.getProperty(floatingContent, "y")) || 0;

      return {
        x,
        y: y + panelY + idleY,
        width: CUBE_FLOATING_LAYOUT_WIDTH,
        height: CUBE_FLOATING_LAYOUT_HEIGHT,
      };
    };

    const isPointerOverFloatingCard = () => {
      if (!isFloatingVisible) {
        return false;
      }

      const card = getFloatingCardLayout();
      return (
        latestPointerLocal.x >= card.x &&
        latestPointerLocal.x <= card.x + card.width &&
        latestPointerLocal.y >= card.y &&
        latestPointerLocal.y <= card.y + card.height
      );
    };

    const updateConnectorLine = () => {
      if (!isFloatingVisible || !floatingMesh) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const cubePosition = projectedPosition.copy(floatingMesh.position);
      cubePosition.project(camera);

      const cubeX = (cubePosition.x * 0.5 + 0.5) * rect.width;
      const cubeY = (-cubePosition.y * 0.5 + 0.5) * rect.height;
      const card = getFloatingCardLayout();
      let edgeX = THREE.MathUtils.clamp(cubeX, card.x, card.x + card.width);
      let edgeY = THREE.MathUtils.clamp(cubeY, card.y, card.y + card.height);

      const cubeInsideCard =
        cubeX >= card.x &&
        cubeX <= card.x + card.width &&
        cubeY >= card.y &&
        cubeY <= card.y + card.height;

      if (cubeInsideCard) {
        const distances = [
          { edge: "top", value: Math.abs(cubeY - card.y) },
          { edge: "bottom", value: Math.abs(card.y + card.height - cubeY) },
          { edge: "left", value: Math.abs(cubeX - card.x) },
          { edge: "right", value: Math.abs(card.x + card.width - cubeX) },
        ].sort((a, b) => a.value - b.value);

        if (distances[0].edge === "top") {
          edgeY = card.y;
        } else if (distances[0].edge === "bottom") {
          edgeY = card.y + card.height;
        } else if (distances[0].edge === "left") {
          edgeX = card.x;
        } else {
          edgeX = card.x + card.width;
        }
      }

      connectorLine.setAttribute("x1", cubeX.toFixed(2));
      connectorLine.setAttribute("y1", cubeY.toFixed(2));
      connectorLine.setAttribute("x2", edgeX.toFixed(2));
      connectorLine.setAttribute("y2", edgeY.toFixed(2));
    };

    const stopFloatingIdle = () => {
      floatingIdleTween?.kill();
      floatingIdleTween = null;
      gsap.set(floatingContent, { y: 0 });
    };

    const startFloatingIdle = () => {
      stopFloatingIdle();
      floatingIdleTween = gsap.to(floatingContent, {
        y: -6,
        duration: 1.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    };

    const runTypewriter = () => {
      typewriterTween?.kill();
      floatingText.textContent = "";

      const characters = [...CUBE_HOVER_MESSAGE_TEXT];
      const state = { count: 0 };

      typewriterTween = gsap.to(state, {
        count: characters.length,
        duration: Math.min(4.8, Math.max(2.5, characters.length * 0.056)),
        ease: "none",
        onUpdate: () => {
          floatingText.textContent = characters.slice(0, Math.floor(state.count)).join("");
        },
        onComplete: () => {
          floatingText.textContent = CUBE_HOVER_MESSAGE_TEXT;
        },
      });
    };

    const showFloating = (mesh) => {
      const wasVisible = isFloatingVisible;
      const targetChanged = floatingMesh !== mesh;
      const shouldRestartText = targetChanged || !isFloatingVisible;
      floatingMesh = mesh;
      pendingFloatingMesh = null;
      isFloatingVisible = true;
      clearFloatingHideTimer();
      updateFloatingPosition(mesh, !wasVisible || targetChanged);
      updateConnectorLine();

      stopFloatingIdle();
      floatingTimeline?.kill();
      floatingTimeline = gsap.timeline({
        onComplete: startFloatingIdle,
      });
      floatingTimeline
        .set(floatingMessage, {
          autoAlpha: 1,
        })
        .to(
          connectorLine,
          {
            autoAlpha: 1,
            duration: 0.24,
            ease: "power2.out",
            overwrite: true,
          },
          0,
        )
        .fromTo(
          floatingPanel,
          {
            scale: 0.94,
            y: 12,
            filter: "blur(8px)",
          },
          {
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.46,
            ease: "back.out(1.25)",
            overwrite: true,
          },
          0,
        );

      if (shouldRestartText) {
        runTypewriter();
      }
    };

    const hideFloating = () => {
      clearFloatingShowTimer();
      clearFloatingHideTimer();
      pendingFloatingMesh = null;
      floatingMesh = null;
      isFloatingVisible = false;
      typewriterTween?.kill();
      stopFloatingIdle();
      floatingTimeline?.kill();
      floatingTimeline = gsap.timeline();
      floatingTimeline.to(floatingPanel, {
        scale: 0.96,
        y: 8,
        filter: "blur(8px)",
        duration: 0.26,
        ease: "power3.inOut",
        overwrite: true,
      });
      floatingTimeline.to(
        floatingMessage,
        {
          autoAlpha: 0,
          duration: 0.22,
          ease: "power3.inOut",
          overwrite: true,
        },
        0,
      );
      floatingTimeline.to(
        connectorLine,
        {
          autoAlpha: 0,
          duration: 0.18,
          ease: "power3.inOut",
          overwrite: true,
        },
        0,
      );
    };

    const scheduleFloatingHide = () => {
      if (isFocusMode) {
        return;
      }

      if (!isFloatingVisible || isFloatingHovered || hovered) {
        return;
      }

      clearFloatingHideTimer();
      floatingHideTimer = window.setTimeout(() => {
        if (!isFloatingHovered && !hovered) {
          hideFloating();
        }
      }, CUBE_FLOATING_HIDE_DELAY_MS);
    };

    const scheduleFloatingShow = (mesh) => {
      clearFloatingHideTimer();

      if (pendingFloatingMesh === mesh && floatingShowTimer) {
        return;
      }

      clearFloatingShowTimer();
      pendingFloatingMesh = mesh;
      floatingShowTimer = window.setTimeout(() => {
        floatingShowTimer = 0;
        if (hovered === mesh) {
          showFloating(mesh);
        }
      }, CUBE_FLOATING_SHOW_DELAY_MS);
    };

    const handleFloatingPointerEnter = () => {
      isFloatingHovered = true;
      clearFloatingHideTimer();
    };

    const handleFloatingPointerLeave = () => {
      isFloatingHovered = false;
      scheduleFloatingHide();
    };

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

    const getLabelElements = () => labelRefs.map(({ element }) => element);

    const updateAutoRotateButtonState = () => {
      autoRotateButton.setAttribute("aria-pressed", String(isAutoRotateEnabled));
      autoRotateButton.dataset.active = isAutoRotateEnabled ? "true" : "false";
      gsap.to(autoRotateButton, {
        backgroundColor: isAutoRotateEnabled ? "rgba(107,107,107,0.92)" : "rgba(146,146,146,0.58)",
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const stopFocusRotation = () => {
      focusRotateTween?.kill();
      focusRotateTween = null;
    };

    const startFocusRotation = (mesh = focusedMesh) => {
      stopFocusRotation();

      if (!mesh || !isAutoRotateEnabled) {
        return;
      }

      focusRotateTween = gsap.to(mesh.rotation, {
        y: `+=${Math.PI * 2}`,
        duration: CUBE_FOCUS_AUTO_ROTATE_DURATION,
        repeat: -1,
        ease: "none",
      });
    };

    const stopFocusMotion = () => {
      focusTimeline?.kill();
      focusTimeline = null;
      focusIdleTween?.kill();
      focusIdleTween = null;
      stopFocusRotation();
    };

    const dimSceneChrome = () => {
      tweenObjectOpacity(floorGrid, CUBE_FOCUS_GRID_OPACITY);
      floorGrid.visible = false;
      axisLines.forEach((line) => tweenObjectOpacity(line, CUBE_FOCUS_GRID_OPACITY));
      tweenObjectOpacity(hotspotGroup, CUBE_FOCUS_HOTSPOT_OPACITY);
      gsap.to(getLabelElements(), {
        opacity: 0,
        duration: 0.35,
        ease: "power3.out",
        overwrite: true,
      });
    };

    const restoreSceneChrome = () => {
      floorGrid.visible = true;
      restoreObjectOpacity(floorGrid);
      axisLines.forEach((line) => restoreObjectOpacity(line));
      restoreObjectOpacity(hotspotGroup);
      gsap.to(getLabelElements(), {
        opacity: 1,
        duration: 0.42,
        ease: "power3.out",
        overwrite: true,
        onComplete: () => {
          getLabelElements().forEach((element) => {
            element.style.opacity = "";
          });
        },
      });
    };

    const setNodeFocusOpacity = (targetMesh) => {
      nodesGroup.children.forEach((mesh) => {
        mesh.material.transparent = mesh !== targetMesh;
        gsap.to(mesh.material, {
          opacity: mesh === targetMesh ? 1 : CUBE_FOCUS_DIM_OPACITY,
          duration: 0.42,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    };

    const restoreNodeOpacity = () => {
      nodesGroup.children.forEach((mesh) => {
        mesh.material.transparent = true;
        gsap.to(mesh.material, {
          opacity: mesh.material.userData.baseOpacity ?? 0.94,
          duration: 0.42,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    };

    const startFocusedCubeMotion = (mesh) => {
      focusIdleTween = gsap.to(mesh.position, {
        y: GRAPH_CENTER.y + 4,
        duration: 1.65,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      startFocusRotation(mesh);
    };

    const setAutoRotateEnabled = (isEnabled) => {
      isAutoRotateEnabled = isEnabled;
      updateAutoRotateButtonState();

      if (!isFocusMode || !focusedMesh) {
        return;
      }

      if (isAutoRotateEnabled) {
        startFocusRotation(focusedMesh);
      } else {
        stopFocusRotation();
      }
    };

    const enterFocusMode = (mesh) => {
      if (!mesh || isFocusMode) {
        return;
      }

      isFocusMode = true;
      focusedMesh = mesh;
      isAutoRotateEnabled = true;
      updateAutoRotateButtonState();
      onFocusChangeRef.current(true);
      hideFloating();
      clearFloatingShowTimer();
      clearFloatingHideTimer();
      clearTickHighlight();
      hovered = null;
      pressedMesh = null;
      outlinePass.selectedObjects = [];
      outlinePass.enabled = false;
      controls.enabled = false;
      container.style.cursor = "default";

      nodesGroup.children.forEach((node) => {
        gsap.killTweensOf(node.position);
        gsap.killTweensOf(node.scale);
        gsap.killTweensOf(node.rotation);
      });

      setNodeFocusOpacity(mesh);
      dimSceneChrome();
      gsap.to(focusBackButton, {
        autoAlpha: 1,
        y: 0,
        pointerEvents: "auto",
        duration: 0.28,
        ease: "power3.out",
        overwrite: true,
      });
      gsap.to(autoRotateButton, {
        autoAlpha: 1,
        y: 0,
        pointerEvents: "auto",
        duration: 0.28,
        ease: "power3.out",
        overwrite: true,
      });

      stopFocusMotion();
      focusTimeline = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          startFocusedCubeMotion(mesh);
          showFloating(mesh);
        },
      });
      focusTimeline
        .to(mesh.position, {
          x: GRAPH_CENTER.x,
          y: GRAPH_CENTER.y,
          z: GRAPH_CENTER.z,
          duration: 0.72,
        }, 0)
        .to(mesh.scale, {
          x: CUBE_FOCUS_SCALE,
          y: CUBE_FOCUS_SCALE,
          z: CUBE_FOCUS_SCALE,
          duration: 0.72,
        }, 0)
        .to(mesh.rotation, {
          x: 0,
          y: mesh.rotation.y + 0.35,
          z: 0,
          duration: 0.72,
        }, 0);
    };

    const exitFocusMode = () => {
      if (!isFocusMode || !focusedMesh) {
        return;
      }

      const mesh = focusedMesh;
      const baseRotation = mesh.userData.baseRotation;
      hideFloating();
      onFocusChangeRef.current(false);
      stopFocusMotion();
      restoreNodeOpacity();
      restoreSceneChrome();
      nodesGroup.children.forEach((node) => {
        if (node !== mesh) {
          tweenNodePosition(node, node.userData.basePosition, CUBE_HOVER_RESET_DURATION, "power3.out");
        }
      });
      outlinePass.selectedObjects = [];
      gsap.to(focusBackButton, {
        autoAlpha: 0,
        y: -6,
        pointerEvents: "none",
        duration: 0.22,
        ease: "power3.inOut",
        overwrite: true,
      });
      gsap.to(autoRotateButton, {
        autoAlpha: 0,
        y: -6,
        pointerEvents: "none",
        duration: 0.22,
        ease: "power3.inOut",
        overwrite: true,
      });

      focusTimeline = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          isFocusMode = false;
          focusedMesh = null;
          controls.enabled = true;
          outlinePass.enabled = true;
        },
      });
      focusTimeline
        .to(mesh.position, {
          x: mesh.userData.basePosition.x,
          y: mesh.userData.basePosition.y,
          z: mesh.userData.basePosition.z,
          duration: 0.62,
        }, 0)
        .to(mesh.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.62,
        }, 0)
        .to(mesh.rotation, {
          x: baseRotation.x,
          y: baseRotation.y,
          z: baseRotation.z,
          duration: 0.62,
        }, 0);
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
      latestPointerLocal.x = event.clientX - rect.left;
      latestPointerLocal.y = event.clientY - rect.top;
      pointer.x = (latestPointerLocal.x / rect.width) * 2 - 1;
      pointer.y = -(latestPointerLocal.y / rect.height) * 2 + 1;
    };

    const getMeshUnderPointer = (event) => {
      updatePointer(event);

      if (isPointerOverFloatingCard()) {
        return null;
      }

      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(nodesGroup.children, false)[0]?.object ?? null;
    };

    const clearPointer = () => {
      pointer.set(-9999, -9999);
      if (isFocusMode) {
        return;
      }

      hovered = null;
      outlinePass.selectedObjects = [];
      resetCubeSpread();
      clearFloatingShowTimer();
      clearTickHighlight();
      container.style.cursor = "default";
      scheduleFloatingHide();
    };

    const handleWheel = (event) => {
      event.preventDefault();
      if (isFocusMode) {
        return;
      }

      const factor = event.deltaY > 0 ? 1.1 : 1 / 1.1;
      targetZoomDistance = Math.max(86, Math.min(360, targetZoomDistance * factor));
    };

    const handleCanvasPointerDown = (event) => {
      if (isFocusMode) {
        return;
      }

      pressedMesh = getMeshUnderPointer(event);
    };

    const handleCanvasPointerUp = (event) => {
      if (isFocusMode) {
        pressedMesh = null;
        return;
      }

      const releasedMesh = getMeshUnderPointer(event);
      if (pressedMesh && releasedMesh && pressedMesh === releasedMesh) {
        enterFocusMode(releasedMesh);
      }
      pressedMesh = null;
    };

    const handleFocusBackClick = () => {
      exitFocusMode();
    };

    const handleAutoRotateClick = () => {
      setAutoRotateEnabled(!isAutoRotateEnabled);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    requestAnimationFrame(resize);

    container.addEventListener("pointermove", updatePointer);
    container.addEventListener("pointerleave", clearPointer);
    floatingContent.addEventListener("pointerenter", handleFloatingPointerEnter);
    floatingContent.addEventListener("pointerleave", handleFloatingPointerLeave);
    focusBackButton.addEventListener("click", handleFocusBackClick);
    autoRotateButton.addEventListener("click", handleAutoRotateClick);
    renderer.domElement.addEventListener("pointerdown", handleCanvasPointerDown);
    renderer.domElement.addEventListener("pointerup", handleCanvasPointerUp);
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
        if (isFocusMode && mesh === focusedMesh) {
          return;
        }

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
      if (!isFocusMode) {
        hotspotGroup.children.forEach((child) => {
          if (!child.userData.pulse) {
            return;
          }

          const pulse = Math.sin(pulseTime + child.userData.phase);
          child.scale.setScalar(0.88 + pulse * 0.14);
          child.material.opacity = 0.075 + pulse * 0.04;
        });
      }

      occlusionTick += 1;
      if (!isFocusMode && occlusionTick % 4 === 0) {
        labelRefs.forEach(({ label, element }) => {
          const distance = camera.position.distanceTo(label.position);
          scratchVector.copy(label.position).sub(camera.position).normalize();
          labelRaycaster.set(camera.position, scratchVector);
          const hits = labelRaycaster.intersectObjects(nodesGroup.children, false);
          element.style.opacity = hits.length > 0 && hits[0].distance < distance - 0.8 ? "0.12" : "";
        });
      }

      if (!isFocusMode) {
        const pointerBlockedByFloating = isPointerOverFloatingCard();
        if (pointerBlockedByFloating) {
          clearFloatingHideTimer();
          if (isFloatingVisible && floatingMesh) {
            updateFloatingPosition(floatingMesh);
          }
        } else {
          raycaster.setFromCamera(pointer, camera);
          const hits = raycaster.intersectObjects(nodesGroup.children, false);
          if (hits.length > 0) {
            const mesh = hits[0].object;
            if (hovered !== mesh) {
              hovered = mesh;
              outlinePass.selectedObjects = [mesh];
              spreadCubesFrom(mesh);
              scheduleFloatingShow(mesh);
              highlightTicks(mesh.userData.x, mesh.userData.y, mesh.userData.z);
              container.style.cursor = "pointer";
            }
            clearFloatingHideTimer();
            if (isFloatingVisible && floatingMesh === mesh) {
              updateFloatingPosition(mesh);
            }
          } else if (hovered && isFloatingHovered) {
            if (isFloatingVisible && floatingMesh) {
              updateFloatingPosition(floatingMesh);
            }
          } else if (hovered) {
            hovered = null;
            outlinePass.selectedObjects = [];
            resetCubeSpread();
            clearFloatingShowTimer();
            clearTickHighlight();
            container.style.cursor = "default";
            scheduleFloatingHide();
          } else if (isFloatingVisible && floatingMesh) {
            updateFloatingPosition(floatingMesh);
          }
        }
      } else if (isFloatingVisible && focusedMesh) {
        updateFloatingPosition(focusedMesh);
      }

      if (isFloatingVisible && floatingMesh) {
        updateConnectorLine();
      }

      composer.render();
      cssRenderer.render(scene, camera);
    };

    render();

    return () => {
      disposed = true;
      onFocusChangeRef.current(false);
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", updatePointer);
      container.removeEventListener("pointerleave", clearPointer);
      floatingContent.removeEventListener("pointerenter", handleFloatingPointerEnter);
      floatingContent.removeEventListener("pointerleave", handleFloatingPointerLeave);
      focusBackButton.removeEventListener("click", handleFocusBackClick);
      autoRotateButton.removeEventListener("click", handleAutoRotateClick);
      renderer.domElement.removeEventListener("pointerdown", handleCanvasPointerDown);
      renderer.domElement.removeEventListener("pointerup", handleCanvasPointerUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      clearFloatingShowTimer();
      clearFloatingHideTimer();
      typewriterTween?.kill();
      floatingIdleTween?.kill();
      floatingTimeline?.kill();
      stopFocusMotion();
      gsap.killTweensOf(floatingMessage);
      gsap.killTweensOf(floatingPanel);
      gsap.killTweensOf(floatingContent);
      gsap.killTweensOf(connectorLine);
      gsap.killTweensOf(focusBackButton);
      gsap.killTweensOf(autoRotateButton);
      nodesGroup.children.forEach((mesh) => {
        gsap.killTweensOf(mesh.position);
        gsap.killTweensOf(mesh.scale);
        gsap.killTweensOf(mesh.rotation);
        gsap.killTweensOf(mesh.material);
      });
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
      className="absolute inset-0 overflow-hidden bg-[#EBE9ED]"
      data-layer-name="Cube Map 3D Scene"
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_48%_42%,rgba(255,255,255,0.54),rgba(235,233,237,0)_42%),linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(235,233,237,0)_46%,rgba(189,187,193,0.22)_100%)]" />
      <button
        ref={focusBackButtonRef}
        type="button"
        aria-label="Back to cube map"
        className="absolute left-[40px] top-[40px] z-[90] flex h-[40.5px] w-[46px] items-center justify-center rounded-full border-0 bg-[#8c8c8c] p-0 text-white shadow-[0_14px_34px_rgba(40,40,44,0.18)] outline-none backdrop-blur-[14px] focus-visible:ring-2 focus-visible:ring-white/80"
        data-layer-name="Button_back"
      >
        <svg
          aria-hidden="true"
          className="h-[16px] w-[18px]"
          fill="none"
          focusable="false"
          viewBox="0 0 18 16"
        >
          <path
            d="M8 2 2.5 8 8 14M2.5 8h8.25A4.25 4.25 0 0 0 15 3.75V2.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
      <button
        ref={autoRotateButtonRef}
        type="button"
        aria-label="Auto rotate"
        aria-pressed="true"
        className="absolute right-[40px] top-[40px] z-[90] flex h-[41px] w-[47px] items-center justify-center rounded-full border-0 bg-[#6b6b6b]/90 p-0 text-white shadow-[0_14px_34px_rgba(40,40,44,0.18)] outline-none backdrop-blur-[14px] transition-colors focus-visible:ring-2 focus-visible:ring-white/80 data-[active=false]:text-white/70"
        data-active="true"
        data-layer-name="Button_Auto Rotate"
      >
        <svg
          aria-hidden="true"
          className="h-[18px] w-[22px]"
          fill="none"
          focusable="false"
          viewBox="0 0 22 18"
        >
          <path
            d="M7.1 5.45A5.2 5.2 0 0 1 12.2 2h1.35"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M11.95 0.5 14.5 2.95 11.95 5.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M6.25 14.95H2.95a1.45 1.45 0 0 1-1.45-1.45v-3.3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="m3.85 8.25-2.35 2.4-2.35-2.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            transform="translate(1.35 2.4)"
          />
          <rect
            height="7"
            rx="1.3"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="13.2"
            y="9.3"
          />
        </svg>
      </button>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[70] h-full w-full"
        focusable="false"
      >
        <line
          ref={connectorLineRef}
          stroke="rgba(40,40,44,0.38)"
          strokeDasharray="4 6"
          strokeLinecap="round"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <CubeHoverMessage
        ref={floatingMessageRef}
        contentRef={floatingContentRef}
        panelRef={floatingPanelRef}
        textRef={floatingTextRef}
      />
      <style>
        {`
          .cube-map-label-tick {
            color: rgba(36, 36, 38, 0.54);
            font-family: Pretendard, system-ui, sans-serif;
            font-size: 10px;
            font-weight: 600;
            line-height: 1;
            text-shadow: 0 1px 6px rgba(255, 255, 255, 0.78);
            transition: color 160ms ease, opacity 180ms ease, transform 160ms ease;
            user-select: none;
            white-space: nowrap;
          }

          .cube-map-label-tick.active {
            color: rgba(10, 10, 12, 0.92);
            transform: translateY(-1px) scale(1.06);
          }

          .cube-map-label-axis {
            border: 1px solid currentColor;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.58);
            box-shadow: 0 10px 30px rgba(56, 54, 60, 0.12);
            font-family: Pretendard, system-ui, sans-serif;
            font-size: 11px;
            font-weight: 800;
            line-height: 1;
            padding: 4px 8px;
            text-shadow: 0 1px 6px rgba(255, 255, 255, 0.72);
            user-select: none;
            white-space: nowrap;
          }
        `}
      </style>
    </div>
  );
}
