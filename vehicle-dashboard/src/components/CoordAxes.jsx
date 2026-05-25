import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import MODEL_SRC from "../assets/CURSR_V_10.glb?url";

const TWO_PI = Math.PI * 2;
const AXIS_ORIGIN = [0, 0.02, 0.62];

function toRadians(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.abs(n) > TWO_PI ? (n * Math.PI) / 180 : n;
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
  const rotation = [toRadians(rx), toRadians(ry), toRadians(rz)];

  return (
    <group rotation={rotation}>
      <RocketModel />
      <mesh position={AXIS_ORIGIN}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#666" />
      </mesh>
      <group position={AXIS_ORIGIN}>
        <Arrow axis="x" color="#e84040" />
        <Arrow axis="y" color="#38d878" />
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
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_SRC);
