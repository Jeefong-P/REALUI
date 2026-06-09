import React, { useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";

// === โครงสร้างการอ้างอิงโมเดลจรวดหลักของคุณ ===
// 💡 ในโปรเจกต์จริงบนเครื่องคอมพิวเตอร์ของคุณ ให้ลบเครื่องหมาย // หน้าบรรทัดด้านล่างนี้ออกเพื่อดึงโมเดลจริงมาแสดงผลครับ:
import MODEL_SRC from "../assets/CURSR_V_10.glb?url";

const AXIS_ORIGIN = [0, 0, 0];

// ฟังก์ชันแปลงค่ามุมองศา (Degrees) เป็นเรเดียน (Radians) ที่ถูกต้อง (ใช้สำหรับโหมดมุมสัมบูรณ์)
function toRad(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;

  // หากค่ามีขนาดเกิน +- 2*PI (ประมาณ +-6.28) แสดงว่าเป็นหน่วยองศาแน่นอน ให้แปลงเป็นเรเดียน
  if (Math.abs(n) > 2 * Math.PI) {
    return (n * Math.PI) / 180;
  }
  return n;
}

// ส่วนแสดงผลลูกศรบอกทิศทางแกนหมุน (Arrow Component)
function Arrow({ axis, color }) {
  const shaftLength = 0.6;
  const coneLength = 0.15;
  const rotation =
    axis === "x"
      ? [0, 0, -Math.PI / 2]
      : axis === "z"
        ? [Math.PI / 2, 0, 0]
        : [0, 0, 0];

  return (
    <group rotation={rotation}>
      <mesh position={[0, shaftLength / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, shaftLength, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, shaftLength + coneLength / 2, 0]}>
        <coneGeometry args={[0.045, coneLength, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// แบบจำลองจรวดสำรองคุณภาพสูง (Procedural Rocket)
// จะทำงานอัตโนมัติเมื่อระบบตรวจไม่พบไฟล์โมเดลจรวดจริงบนหน้าเว็บทดสอบ
function ProceduralRocket() {
  return (
    <group rotation={[0, 0, 0]}>
      {/* ตัวถังจรวดหลัก (Main Body) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.0, 16]} />
        <meshStandardMaterial color="#f3f4f6" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* ส่วนหัวกรวยจรวด (Nose Cone) */}
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[0.15, 0.3, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* กระจกหน้าต่างห้องโดยสารกลม (Cabin Window) */}
      <mesh position={[0, 0.2, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* ครีบหางประคองทิศทางทั้ง 4 ข้าง (Rocket Fins) */}
      <group position={[0, -0.4, 0]}>
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.15, 0.3, 0.02]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.15, 0.3, 0.02]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 6, 0, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0, -0.22]} rotation={[-Math.PI / 6, 0, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
}

// คอมโพเนนต์โหลดโมเดล 3D GLTF จริงจากเครื่องผู้ใช้
function GLTFRocket({ modelSrc }) {
  const { scene } = useGLTF(modelSrc);
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

// ฉากจำลองสภาพแวดล้อม 3 มิติและการประมวลผลหมุน (3D Scene and Rotation Management)
function Scene({ rx, ry, rz, useGyroIntegration, onUpdateAngles }) {
  const groupRef = useRef();

  // บันทึกสะสมองศาการหมุนปัจจุบันสำหรับการทำ Integration (หน่วยเป็น Radians)
  const currentRotation = useRef([0, 0, 0]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;

    if (useGyroIntegration) {
      // 🚀 ประมวลผลจากข้อมูลดิบ rad/sec โดยตรง (ไม่ต้องแปลงสเกลองศา!)
      const radX = Number(rx) || 0;
      const radY = Number(ry) || 0;
      const radZ = Number(rz) || 0;

      // อินทิเกรตมุมสะสม: Angle = Angle + (rad/sec * dt)
      currentRotation.current[0] += radX * delta;
      currentRotation.current[1] += radY * delta;
      currentRotation.current[2] += radZ * delta;

      targetX = currentRotation.current[0];
      targetY = currentRotation.current[1];
      targetZ = currentRotation.current[2];
    } else {
      // 🌌 กรณีข้อมูลเป็นมุมสัมบูรณ์ (Absolute Pitch, Roll, Yaw) อยู่แล้ว
      targetX = toRad(rx);
      targetY = toRad(ry);
      targetZ = toRad(rz);
    }

    // ฟังก์ชัน Exponential smoothing (Low-Pass Filter) เพื่อความนุ่มนวลสูงสุดในการหมุนโมเดล
    const k = 1 - Math.exp(-10 * delta); // อัตราลู่เข้าประมวลผล ~10 rad/s
    const r = groupRef.current.rotation;

    r.x += (targetX - r.x) * k;
    r.y += (targetY - r.y) * k;
    r.z += (targetZ - r.z) * k;

    // ส่งค่ามุมปัจจุบัน (ในหน่วยองศา) กลับไปอัปเดตตัวเลขแสดงผลในตำนาน (Legend) แบบความหน่วงต่ำสุด
    if (onUpdateAngles) {
      onUpdateAngles(
        r.x * (180 / Math.PI),
        r.y * (180 / Math.PI),
        r.z * (180 / Math.PI),
      );
    }
  });

  // ตรวจสอบว่าผู้ใช้เปิดใช้งานการอิมพอร์ตโมเดลจริงหรือไม่
  const actualModelSource = typeof MODEL_SRC !== "undefined" ? MODEL_SRC : null;

  return (
    <group ref={groupRef}>
      {/* หากตรวจพบการอิมพอร์ต MODEL_SRC สำเร็จ จะทำการโหลดโมเดลจริงของคุณ 
        แต่หากเป็นการรันพรีวิวใน Sandbox ที่ไม่มีไฟล์อยู่จริง จะสลับไปแสดงผล Procedural จรวด 3D อัตโนมัติ ป้องกันบิลด์ล้มเหลว
      */}
      {actualModelSource ? (
        <Suspense fallback={<ProceduralRocket />}>
          <GLTFRocket modelSrc={actualModelSource} />
        </Suspense>
      ) : (
        <ProceduralRocket />
      )}

      {/* จุดศูนย์กลางระบบพิกัดแกน (Origin point) */}
      <mesh position={AXIS_ORIGIN}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#555" />
      </mesh>

      {/* ลูกศรบอกทิศแกนอ้างอิง */}
      <group position={AXIS_ORIGIN}>
        <Arrow axis="x" color="#e84040" /> {/* แกน X สีแดง */}
        <Arrow axis="y" color="#38d878" /> {/* แกน Y สีเขียว */}
        <Arrow axis="z" color="#4488ff" /> {/* แกน Z สีน้ำเงิน */}
      </group>
    </group>
  );
}

// คอมโพเนนต์หลักที่เปิดรับพิกัดความเอียงเชิงตัวเลข
export default function CoordAxes({ rx = 0, ry = 0, rz = 0 }) {
  // เริ่มต้นตั้งค่าใช้งานโหมด "สะสมมุมจากอัตราหมุน (Gyro Rates)" เป็นหลักเพื่อสอดคล้องกับค่า rad/sec
  const [useGyroIntegration, setUseGyroIntegration] = useState(false);

  // การใช้ Refs เขียนตรงลง DOM เลี่ยงการเรนเดอร์ UI คอขวดของ React ที่ 60 FPS
  const xLegendRef = useRef();
  const yLegendRef = useRef();
  const zLegendRef = useRef();

  const handleUpdateAngles = (degX, degY, degZ) => {
    // จำกัดช่วงมุมแสดงผลให้อยู่ในช่วง -180 ถึง 180 องศาเพื่อให้อ่านค่าง่ายสไตล์นักบิน
    const normalizeDeg = (deg) => {
      let angle = deg % 360;
      if (angle > 180) angle -= 360;
      if (angle < -180) angle += 360;
      return angle;
    };

    if (xLegendRef.current)
      xLegendRef.current.innerText = `X (PITCH): ${normalizeDeg(degX).toFixed(1)}°`;
    if (yLegendRef.current)
      yLegendRef.current.innerText = `Y (YAW): ${normalizeDeg(degY).toFixed(1)}°`;
    if (zLegendRef.current)
      zLegendRef.current.innerText = `Z (ROLL): ${normalizeDeg(degZ).toFixed(1)}°`;
  };

  return (
    <div className="coord-box border border-gray-800 rounded-lg p-4 bg-gray-900/40 relative">
      <div className="absolute top-2 left-2 flex items-center space-x-2 z-10">
        <span className="text-[10px] font-mono text-gray-500 uppercase">
          โหมดประมวลผลหมุน:
        </span>
        <button
          onClick={() => setUseGyroIntegration(!useGyroIntegration)}
          className={`text-[9px] font-mono px-2 py-0.5 rounded transition ${useGyroIntegration ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400"}`}
        >
          {useGyroIntegration
            ? "คำนวณมุมสัมบูรณ์ (Absolute Angle)"
            : "สะสมมุมจากอัตราหมุน (Gyro Rates - rad/s)"}
        </button>
      </div>

      {/* ส่วนแสดงผล Canvas 3 มิติ */}
      <div className="coord-canvas h-[280px]">
        <Canvas
          camera={{ position: [2.5, 2.0, 2.5], fov: 40 }}
          gl={{ alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} />
          <Scene
            rx={rx}
            ry={ry}
            rz={rz}
            useGyroIntegration={useGyroIntegration}
            onUpdateAngles={handleUpdateAngles}
          />
        </Canvas>
      </div>

      {/* คำอธิบายสัญลักษณ์และระดับแกนที่แสดงด้านล่าง (อัปเดตแบบเรียลไทม์ความหน่วงต่ำพิเศษด้วย DOM Refs) */}
      <div className="coord-legend flex justify-center space-x-6 text-xs font-mono font-bold mt-2 border-t border-gray-800/60 pt-2">
        <span ref={xLegendRef} style={{ color: "#e84040" }}>
          X (PITCH): 0.0°
        </span>
        <span ref={yLegendRef} style={{ color: "#38d878" }}>
          Y (YAW): 0.0°
        </span>
        <span ref={zLegendRef} style={{ color: "#4488ff" }}>
          Z (ROLL): 0.0°
        </span>
      </div>
    </div>
  );
}
