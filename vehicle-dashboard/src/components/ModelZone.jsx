import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls, Center } from "@react-three/drei";
import MODEL_SRC from "../assets/CURSR_V_10.glb?url";

function SpinningModel() {
  const { scene } = useGLTF(MODEL_SRC);
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.03;
    }
  });

  return (
    <group ref={ref}>
      <Center>
        <primitive
          object={scene}
          scale={30}
          position={[0, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        />
      </Center>
    </group>
  );
}

export default function ModelZone() {
  return (
    <div id="model-zone">
      <Canvas
        camera={{ position: [26, -25, 75] }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight />
        <Environment preset="sunset" background={false} />
        <SpinningModel />
        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_SRC);
