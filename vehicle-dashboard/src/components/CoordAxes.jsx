import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import MODEL_SRC from "../assets/CURSR_V_10.glb?url";

const AXIS_ORIGIN = [0, 0.02, 0.62];

function toRad(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Arrow({ axis, color }) {
  const shaftLength = 0.34;
  const coneLength = 0.1;
  const rotation =
    axis === "x"
      ? [0, 0, -Math.PI / 2]
      : axis === "z"
        ? [Math.PI / 2, 0, 0]
        : [0, 0, 0];

  return (
    <group rotation={rotation}>
      <mesh position={[0, shaftLength / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, shaftLength, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, shaftLength + coneLength / 2, 0]}>
        <coneGeometry args={[0.056, coneLength, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function RocketModel() {
  const { scene } = useGLTF(MODEL_SRC);
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <Center>
      <primitive
        object={model}
        scale={0.8}
        position={[0, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </Center>
  );
}

function Scene({ rx, ry, rz }) {
  const groupRef = useRef();
  const targetRef = useRef([0, 0, 0]);
  targetRef.current = [toRad(rx), toRad(ry), toRad(rz)];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Exponential smoothing — frame-rate independent, ~8 rad/s convergence speed
    const k = 1 - Math.exp(-8 * delta);
    const r = groupRef.current.rotation;
    const [tx, ty, tz] = targetRef.current;
    r.x += (tx - r.x) * k;
    r.y += (ty - r.y) * k;
    r.z += (tz - r.z) * k;
  });

  return (
    <group ref={groupRef}>
      <RocketModel />
      <mesh position={AXIS_ORIGIN}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#666" />
      </mesh>
      <group position={AXIS_ORIGIN}>
        <Arrow axis="x" color="#e84040" />
        <Arrow axis="y" color="#38d878" />
        <Arrow axis="z" color="#4488ff" />
      </group>
    </group>
  );
}

// rx / ry / rz accept radians, or degrees when telemetry sends values outside +/-2PI.
export default function CoordAxes({ rx = 0, ry = 0, rz = 0 }) {
  return (
    <div className="coord-box">
      <div className="coord-canvas">
        <Canvas
          camera={{ position: [2.2, 1.8, 2.2], fov: 42 }}
          gl={{ alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={1.4} />
          <Environment preset="sunset" background={false} />
          <Scene rx={rx} ry={ry} rz={rz} />
        </Canvas>
      </div>
      <div className="coord-legend">
        <span style={{ color: "#e84040" }}>X</span>
        <span style={{ color: "#38d878" }}>Y</span>
        <span style={{ color: "#4488ff" }}>Z</span>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_SRC);
