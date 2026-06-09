import { WebSocketServer } from "ws";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const SERIAL_PORT = "COM15";
const BAUD_RATE = 115200;
const WS_PORT = 9001;

// CSV field indices
// 0:tick  1:pressure(Pa)  2:temp(0.01°C)  3:altitude(m)  4:servo(skip)
// 5:accX  6:accY  7:accZ  8:gx  9:gy  10:gz  11:tempIMU
// 12:lat  13:lon  14:heading  15:gpsFix  16:velocity
// 17:flightState  18:filtered_altitude  19:filtered_acceleration
const I = {
  TICK: 0,
  PRESSURE: 1,
  TEMP: 2,
  ALT: 3,
  AX: 5,
  AY: 6,
  AZ: 7,
  GX: 8,
  GY: 9,
  GZ: 10,
  LAT: 12,
  LON: 13,
  HEADING: 14,
  GPS_FIX: 15,
  VELOCITY: 16,
  FLIGHT_STATE: 17,
  FILTERED_ALT: 18,
  FILTERED_ACCEL: 19,
};

// ── Stateful transform ─────
// ───────────────────────────────────────────────────
let launchTick = null;
let prevTick = null;
let rx = 0, ry = 0, rz = 0;

function formatMetT(tick) {
  const totalMs = Math.max(0, tick - (launchTick ?? tick));
  const s = Math.floor(totalMs / 1000);
  const cs = Math.floor((totalMs % 1000) / 10);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(cs)}`;
}

function transformCSV(line) {
  const f = line.split(",");
  if (f.length < 11) return null;

  const tick = Number(f[I.TICK]);
  if (!Number.isFinite(tick)) return null;

  const ax = parseFloat(f[I.AX]) || 0;
  const ay = parseFloat(f[I.AY]) || 0;
  const az = parseFloat(f[I.AZ]) || 0;
  const gx = parseFloat(f[I.GX]) || 0;
  const gy = parseFloat(f[I.GY]) || 0;
  const gz = parseFloat(f[I.GZ]) || 0;

  const flightState = f[I.FLIGHT_STATE]?.trim() || "IDLE";

  // Latch T+0 on first non-IDLE state (matches simulation.js)
  if (launchTick === null && flightState !== "IDLE") launchTick = tick;

  // Gyro integration → orientation (axis remap: gz→rx, gy→ry, gx→rz)
  const dt = prevTick !== null ? (tick - prevTick) / 1000 : 0;
  prevTick = tick;
  rx += gz * dt;
  ry += gy * dt;
  rz += gx * dt;

  const filteredAlt   = f[I.FILTERED_ALT]   != null ? parseFloat(f[I.FILTERED_ALT])   : null;
  const filteredAccel = f[I.FILTERED_ACCEL] != null ? parseFloat(f[I.FILTERED_ACCEL]) : null;

  return {
    // GNSS
    lat:      parseFloat(f[I.LAT])      || 0,
    lon:      parseFloat(f[I.LON])      || 0,
    heading:  parseFloat(f[I.HEADING])  || 0,
    gpsFix:   Number(f[I.GPS_FIX])  > 0,
    velocity: parseFloat(f[I.VELOCITY]) || 0,

    // Altitude & motion — prefer filtered values when available
    altitude:     filteredAlt   ?? parseFloat(f[I.ALT]) || 0,
    acceleration: filteredAccel ?? Math.sqrt(ax * ax + ay * ay + az * az),

    // MS5607 — raw units: temperature in 0.01°C, pressure in Pa
    temp:     parseFloat(f[I.TEMP]) / 100,
    pressure: parseFloat(f[I.PRESSURE]) / 100,

    // BMI088 accelerometer (m/s²)
    ax, ay, az,

    // BMI088 gyroscope (rad/s)
    gx, gy, gz,

    // Integrated orientation
    rx, ry, rz,

    // Flight state
    flightState,

    metT: formatMetT(tick),
  };
}

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[ws] listening on ws://localhost:${WS_PORT}`);

wss.on("connection", (ws) => {
  console.log(`[ws] dashboard connected — clients: ${wss.clients.size}`);
  ws.on("close", () =>
    console.log(`[ws] dashboard disconnected — clients: ${wss.clients.size}`),
  );
});

// ── Serial port ───────────────────────────────────────────────────────────────
const serial = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

serial.on("open", () =>
  console.log(`[serial] opened ${SERIAL_PORT} @ ${BAUD_RATE}`),
);
serial.on("error", (e) => console.error(`[serial] ERROR: ${e.message}`));
serial.on("close", () => console.warn(`[serial] port closed`));

let rxCount = 0;
let skippedCount = 0;

parser.on("data", (line) => {
  line = line.trim();

  const packet = transformCSV(line);
  if (!packet) {
    skippedCount++;
    console.log(`[serial] bad line skipped (${skippedCount}): ${line}`);
    return;
  }

  rxCount++;
  process.stdout.write(
    `\r[rx #${rxCount}]  state: ${packet.flightState.padEnd(8)}  alt: ${String(packet.altitude.toFixed(1)).padStart(8)} m  accel: ${String(packet.acceleration.toFixed(2)).padStart(7)} m/s²  metT: ${packet.metT}`,
  );

  const out = JSON.stringify(packet);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(out);
  }
});
