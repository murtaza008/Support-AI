"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  ShadowMaterial,
  Sphere,
  Vector3,
  type Group,
} from "three";
import {
  RETRIEVED,
  TILE_COUNT,
  TILE_H,
  TILE_W,
  answerVisibility,
  questionVisibility,
  tileAt,
  tileDim,
  tileHighlight,
} from "./layouts";
import { ANSWER_LINES, QUESTION, tileInfo } from "./content";
import { answerTexture, questionTexture, readPalette, tileTexture, type Palette } from "./textures";

export type HoverInfo = { x: number; y: number; title: string; detail: string } | null;

type Props = {
  /** Target scroll progress in [0, 4]; written by the page, read every frame. */
  progressRef: RefObject<number>;
  active: boolean;
  reducedMotion: boolean;
  onHover: (info: HoverInfo) => void;
  onReady?: () => void;
  /** The browser dropped the WebGL context; the page shows the still image instead. */
  onLost?: () => void;
};

/** Theme palette that follows the html `dark` class. */
function usePalette() {
  const [palette, setPalette] = useState<Palette>(() => readPalette());
  useEffect(() => {
    const mo = new MutationObserver(() => setPalette(readPalette()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return palette;
}

const dummy = new Object3D();
const tmpColor = new Color();
const tmpVec = new Vector3();

function World({ progressRef, reducedMotion, onHover, onReady }: Omit<Props, "active" | "onLost">) {
  const palette = usePalette();
  const group = useRef<Group>(null);
  const tiles = useRef<InstancedMesh>(null);
  const question = useRef<Mesh>(null);
  const answer = useRef<Mesh>(null);
  const lines = useRef<LineSegments>(null);
  const progress = useRef(0);

  // Shared resources: one geometry and one texture for all 96 tiles.
  const tileGeo = useMemo(() => new BoxGeometry(TILE_W * 0.93, TILE_H * 0.9, 0.024), []);
  const tileMap = useMemo(() => tileTexture(), []);
  const tileMat = useMemo(() => new MeshStandardMaterial({ map: tileMap, roughness: 0.75, metalness: 0 }), [tileMap]);
  const qGeo = useMemo(() => new PlaneGeometry(2.6, 0.65), []);
  const aGeo = useMemo(() => new PlaneGeometry(2.6, 1.12), []);
  const qTex = useMemo(() => questionTexture(palette, QUESTION), [palette]);
  const aTex = useMemo(() => answerTexture(palette, ANSWER_LINES), [palette]);
  const qMat = useMemo(() => new MeshBasicMaterial({ map: qTex, transparent: true, toneMapped: false }), [qTex]);
  const aMat = useMemo(() => new MeshBasicMaterial({ map: aTex, transparent: true, toneMapped: false }), [aTex]);
  const lineGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(RETRIEVED.length * 6), 3));
    return g;
  }, []);
  const lineMat = useMemo(
    () => new LineBasicMaterial({ color: palette.accentText, transparent: true, opacity: 0 }),
    [palette],
  );
  const groundMat = useMemo(
    () => new ShadowMaterial({ opacity: palette.dark ? 0.4 : 0.1 }),
    [palette],
  );

  const colors = useMemo(() => {
    // Light theme: a warm paper tone, a step darker than the page, so tiles never wash out to white.
    const base = new Color(palette.dark ? "#3a4246" : "#efece6");
    return { base, lit: new Color(palette.accentText), bg: new Color(palette.bg) };
  }, [palette]);

  useEffect(
    () => () => {
      tileGeo.dispose();
      tileMap.dispose();
      tileMat.dispose();
      qGeo.dispose();
      aGeo.dispose();
      lineGeo.dispose();
    },
    [tileGeo, tileMap, tileMat, qGeo, aGeo, lineGeo],
  );
  useEffect(() => () => void [qTex, aTex, qMat, aMat, lineMat, groundMat].forEach((r) => r.dispose()), [
    qTex,
    aTex,
    qMat,
    aMat,
    lineMat,
    groundMat,
  ]);

  useEffect(() => {
    // Tiles move every frame; a fixed bounding sphere keeps raycasts valid.
    if (tiles.current) tiles.current.boundingSphere = new Sphere(new Vector3(), 8);
    progress.current = progressRef.current ?? 0;
  }, [progressRef]);

  // Report ready only once real frames have been drawn, so the still image
  // never gives way to an empty canvas while shaders compile.
  const frames = useRef(0);

  useFrame((state, dt) => {
    // Fit the whole stage in view at any aspect ratio.
    const cam = state.camera as PerspectiveCamera;
    const tan = Math.tan((cam.fov * Math.PI) / 360);
    const fitZ = Math.max(2.45 / (tan * (state.size.width / state.size.height)), 2.25 / tan);
    if (Math.abs(cam.position.z - fitZ) > 0.01) cam.position.z = fitZ;

    const target = progressRef.current ?? 0;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
    progress.current += (target - progress.current) * k;
    const p = progress.current;

    // Pointer parallax
    if (group.current && !reducedMotion) {
      const ry = state.pointer.x * 0.16;
      const rx = -state.pointer.y * 0.08;
      group.current.rotation.y += (ry - group.current.rotation.y) * (1 - Math.exp(-dt * 4));
      group.current.rotation.x += (rx - group.current.rotation.x) * (1 - Math.exp(-dt * 4));
    }

    const mesh = tiles.current;
    if (mesh) {
      for (let i = 0; i < TILE_COUNT; i++) {
        const t = tileAt(i, p);
        dummy.position.set(t.p[0], t.p[1], t.p[2]);
        dummy.rotation.set(t.r[0], t.r[1], t.r[2]);
        dummy.scale.setScalar(t.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tmpColor.copy(colors.base);
        const lit = tileHighlight(i, p);
        if (lit > 0) tmpColor.lerp(colors.lit, lit);
        const dim = tileDim(i, p);
        if (dim > 0) tmpColor.lerp(colors.bg, dim);
        mesh.setColorAt(i, tmpColor);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (frames.current < 2 && ++frames.current === 2) onReady?.();
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    const qv = questionVisibility(p);
    const av = answerVisibility(p);
    if (question.current) {
      question.current.visible = qv > 0.01;
      (question.current.material as MeshBasicMaterial).opacity = qv;
      question.current.position.set(0, 0.1 + av * 1.2, 1.0 - av * 0.1);
      question.current.scale.setScalar(0.9 + qv * 0.1 - av * 0.12);
    }
    if (answer.current) {
      answer.current.visible = av > 0.01;
      (answer.current.material as MeshBasicMaterial).opacity = av;
      answer.current.position.set(0, 0.12, 0.98);
      answer.current.scale.setScalar(0.92 + av * 0.08);
    }

    // Lines from the question to each retrieved chunk (retrieval stage).
    if (lines.current && mesh) {
      const pos = lines.current.geometry.getAttribute("position") as BufferAttribute;
      RETRIEVED.forEach((idx, j) => {
        const t = tileAt(idx, p);
        tmpVec.set(0, 0.1 + av * 1.2, 1.0);
        pos.setXYZ(j * 2, tmpVec.x, tmpVec.y, tmpVec.z);
        pos.setXYZ(j * 2 + 1, t.p[0], t.p[1], t.p[2]);
      });
      pos.needsUpdate = true;
      const lm = lines.current.material as LineBasicMaterial;
      lm.opacity = qv * Math.max(0, 1 - av * 2.5) * 0.8;
      lines.current.visible = lm.opacity > 0.01;
    }
  });

  function hoverTile(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const info = tileInfo(e.instanceId, Math.round(progress.current));
    onHover({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, ...info });
  }

  return (
    <>
      <ambientLight intensity={palette.dark ? 1.1 : 1.15} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={palette.dark ? 1.5 : 1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
        shadow-radius={4}
      />
      <group ref={group}>
        <instancedMesh
          ref={tiles}
          args={[tileGeo, tileMat, TILE_COUNT]}
          castShadow
          onPointerMove={hoverTile}
          onPointerOut={() => onHover(null)}
        />
        <mesh
          ref={question}
          geometry={qGeo}
          material={qMat}
          visible={false}
          renderOrder={2}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHover({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, title: "Customer question", detail: QUESTION });
          }}
          onPointerOut={() => onHover(null)}
        />
        <mesh
          ref={answer}
          geometry={aGeo}
          material={aMat}
          visible={false}
          renderOrder={3}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHover({
              x: e.nativeEvent.clientX,
              y: e.nativeEvent.clientY,
              title: "Answer",
              detail: "Written only from the 6 retrieved chunks. [1] and [2] point at the passages it used.",
            });
          }}
          onPointerOut={() => onHover(null)}
        />
        <lineSegments ref={lines} geometry={lineGeo} material={lineMat} visible={false} renderOrder={1} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.75, 0]} receiveShadow material={groundMat}>
        <planeGeometry args={[16, 16]} />
      </mesh>
    </>
  );
}

export default function Scene({ active, onLost, ...props }: Props) {
  // R3F force-loses the context when it disposes the renderer on unmount
  // (including React Strict Mode's dev double-mount). Only a loss while we
  // are still mounted is a real one.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      // Off screen: render only on demand (resize, theme change) instead of never,
      // so the canvas is never left blank or stretched.
      frameloop={active ? "always" : "demand"}
      shadows
      camera={{ position: [0, 0.1, 6.6], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onHover(null)}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          if (alive.current) onLost?.();
        });
      }}
      aria-hidden
    >
      <World {...props} />
    </Canvas>
  );
}
