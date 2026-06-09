import { WebSocketServer } from "ws";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const SERIAL_PORT = "COM11";
const BAUD_RATE = 115200;
const WS_PORT = 9001;

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[ws] listening on ws://localhost:${WS_PORT}`);

wss.on("connection", (ws, req) => {
  console.log(`[ws] dashboard connected — clients: ${wss.clients.size}`);
  ws.on("close", () =>
    console.log(`[ws] dashboard disconnected — clients: ${wss.clients.size}`),
  );
});

const serial = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

serial.on("open", () =>
  console.log(`[serial] opened ${SERIAL_PORT} @ ${BAUD_RATE}`),
);
serial.on("error", (e) => console.error(`[serial] ERROR: ${e.message}`));
serial.on("close", () => console.warn(`[serial] port closed`));

// ── Stateful transform (persists across packets) ──────────────────────────────
let launchTick = null;   // set on first non-IDLE flightState
let prevTick   = null;   // for gyro integration dt
let rx = 0, ry = 0, rz = 0;

function formatMetT(tick) {
  const totalMs = Math.max(0, tick - (launchTick ?? tick));
  const s  = Math.floor(totalMs / 1000);
  const cs = Math.floor((totalMs % 1000) / 10);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(cs)}`;
}

function transformPacket(raw) {
  const tick = Number(raw.tick) || 0;

  // Detect launch: latch launchTick on first non-IDLE flightState
  const flightState = raw.flightState?.trim() || 'IDLE';
  if (launchTick === null && flightState !== 'IDLE') launchTick = tick;

  // Gyro integration → orientation angles (axis remap matches simulation)
  const dt = prevTick !== null ? (tick - prevTick) / 1000 : 0;
  prevTick = tick;
  rx += (parseFloat(raw.gz) || 0) * dt;
  ry += (parseFloat(raw.gy) || 0) * dt;
  rz += (parseFloat(raw.gx) || 0) * dt;

  return {
    // GNSS
    lat:          parseFloat(raw.latitude)  || 0,
    lon:          parseFloat(raw.longitude) || 0,
    heading:      parseFloat(raw.course)    || 0,
    gpsFix:       Number(raw.fix) > 0,

    // Altitude & motion — filtered values from flight logic
    altitude:     parseFloat(raw.filtered_altitude)     || 0,
    velocity:     parseFloat(raw.speed)                 || 0,
    acceleration: parseFloat(raw.filtered_acceleration) || 0,

    // MS5607 — raw units: temperature in 0.01 °C, pressure in Pa
    temp:         parseFloat(raw.temperature) / 100,
    pressure:     parseFloat(raw.pressure)    / 100,

    // BMI088 accelerometer (m/s²)
    ax: parseFloat(raw.accX) || 0,
    ay: parseFloat(raw.accY) || 0,
    az: parseFloat(raw.accZ) || 0,

    // BMI088 gyroscope (rad/s)
    gx: parseFloat(raw.gx) || 0,
    gy: parseFloat(raw.gy) || 0,
    gz: parseFloat(raw.gz) || 0,

    // Integrated orientation angles (radians)
    rx, ry, rz,

    // Flight state machine
    flightState,

    // Mission elapsed time
    metT: formatMetT(tick),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
let rxCount = 0;
let skippedCount = 0;

parser.on("data", (line) => {
  line = line.trim();

  if (!line.startsWith("{")) {
    skippedCount++;
    console.log(
      `[serial] non-JSON line skipped (total skipped: ${skippedCount}): ${line}`,
    );
    return;
  }

  let raw;
  try {
    raw = JSON.parse(line);
  } catch {
    console.warn(`[serial] malformed JSON skipped: ${line}`);
    return;
  }

  rxCount++;
  const packet = transformPacket(raw);
  const out = JSON.stringify(packet);
  console.log(`[rx #${rxCount}] state: ${packet.flightState.padEnd(8)}  alt: ${packet.altitude.toFixed(1)} m  metT: ${packet.metT}`);

  const clientCount = [...wss.clients].filter((c) => c.readyState === 1).length;
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(out);
  }
});
