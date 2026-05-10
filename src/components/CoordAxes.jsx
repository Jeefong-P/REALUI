import { Canvas } from "@react-three/fiber";

function Arrow({ axis, color }) {
  const rotation =
    axis === "x" ? [0, 0, -Math.PI / 2]
    : axis === "z" ? [Math.PI / 2, 0, 0]
    : [0, 0, 0];

  return (
    <group rotation={rotation}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <coneGeometry args={[0.1, 0.22, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function Scene({ rx, ry, rz }) {
  return (
    <group rotation={[rx, ry, rz]}>
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#666" />
      </mesh>
      <Arrow axis="x" color="#e84040" />
      <Arrow axis="y" color="#38d878" />
      <Arrow axis="z" color="#4488ff" />
    </group>
  );
}

// rx / ry / rz in radians — wire to gyroscope euler angles
export default function CoordAxes({ rx = 0, ry = 0, rz = 0 }) {
  return (
    <div className="coord-box">
      <div className="coord-canvas">
        <Canvas
          camera={{ position: [2.2, 1.8, 2.2], fov: 42 }}
          gl={{ alpha: true }}
          style={{ background: "transparent" }}
        >
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
