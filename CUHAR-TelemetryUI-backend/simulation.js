import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT        = 9003;
const SPEED       = 1;          // playback multiplier — 2 = 2× faster, 0.5 = half speed
const WINDOW_MS   = 200;        // bucket size — send one frame per 200ms of tick time
const START_TICK = 3120000;     // skip all frames with tick below this value

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(filename) {
  const text    = readFileSync(join(__dirname, filename), 'utf8');
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row  = {};
    headers.forEach((h, i) => { row[h] = vals[i]?.trim() ?? ''; });
    return row;
  });
}

// ── Load CSVs ─────────────────────────────────────────────────────────────────
const ms5607   = parseCSV('ms5607.csv');     // tick, temperature, pressure
const accRows  = parseCSV('bmi088acc.csv');  // tick, accX, accY, accZ
const gyroRows = parseCSV('bmi088gyro.csv'); // tick, gx, gy, gz
const gnssRows = parseCSV('gnss.csv');       // tick, latitude, longitude, altitude, fix, speed, course
const logicRows= parseCSV('flightLogic.csv');// tick, flightState, filtered_altitude, filtered_acceleration

function toMap(rows) {
  const m = new Map();
  for (const row of rows) m.set(Number(row.tick), row);
  return m;
}

const ms5607Map  = toMap(ms5607);
const accMap     = toMap(accRows);
const gyroMap    = toMap(gyroRows);
const gnssMap    = toMap(gnssRows);
const logicMap   = toMap(logicRows);

// ── Collect & sort all unique ticks ──────────────────────────────────────────
const allTicks = [...new Set([
  ...ms5607Map.keys(),
  ...accMap.keys(),
  ...gyroMap.keys(),
  ...gnssMap.keys(),
  ...logicMap.keys(),
])].sort((a, b) => a - b);

// ── Build merged frames with forward-fill ────────────────────────────────────
// Each tick uses the most recent row from each source (sensors update at different rates)
let lastLogicTick = 0;
for (const k of logicMap.keys()) { if (k > lastLogicTick) lastLogicTick = k; }

function buildFrames() {
  const frames = [];
  const last   = { ms5607: null, acc: null, gyro: null, gnss: null, logic: null };

  for (const tick of allTicks) {
    if (ms5607Map.has(tick))  last.ms5607 = ms5607Map.get(tick);
    if (accMap.has(tick))     last.acc    = accMap.get(tick);
    if (gyroMap.has(tick))    last.gyro   = gyroMap.get(tick);
    if (gnssMap.has(tick))    last.gnss   = gnssMap.get(tick);
    if (logicMap.has(tick))   last.logic  = logicMap.get(tick);

    // wait until every source has at least one row
    if (!last.ms5607 || !last.acc || !last.gyro || !last.gnss || !last.logic) continue;

    const ms = last.ms5607;
    const a  = last.acc;
    const g  = last.gyro;
    const gn = last.gnss;
    const lo = last.logic;

    frames.push({
      tick,
      packet: {
        // GNSS
        lat:          parseFloat(gn.latitude)  || 0,
        lon:          parseFloat(gn.longitude) || 0,
        heading:      parseFloat(gn.course)    || 0,
        gpsFix:       Number(gn.fix) > 0,

        // Altitude & motion — use filtered values from flightLogic
        altitude:     parseFloat(lo.filtered_altitude)     || 0,
        velocity:     parseFloat(gn.speed)                 || 0,
        acceleration: parseFloat(lo.filtered_acceleration) || 0,

        // MS5607 — raw units: temperature in 0.01 °C, pressure in Pa
        temp:         parseFloat(ms.temperature) / 100,
        pressure:     parseFloat(ms.pressure)    / 100,

        // BMI088 accelerometer (m/s²)
        ax: parseFloat(a.accX) || 0,
        ay: parseFloat(a.accY) || 0,
        az: parseFloat(a.accZ) || 0,

        // BMI088 gyroscope (rad/s) — raw rates
        gx: parseFloat(g.gx) || 0,
        gy: parseFloat(g.gy) || 0,
        gz: parseFloat(g.gz) || 0,

        // rx/ry/rz populated by integrateOrientation() after windowing
        rx: 0, ry: 0, rz: 0,

        // Flight state from logic CSV
        flightState: lo.flightState?.trim() || 'IDLE',
      }
    });
    if (tick >= lastLogicTick) break;
  }
  return frames;
}

const frames = buildFrames();

// Find T+0: first tick where flightState leaves IDLE
const launchFrame = logicRows.find(r => r.flightState && r.flightState.trim() !== 'IDLE');
const launchTick  = launchFrame ? Number(launchFrame.tick) : allTicks[0];

function formatMetT(tick) {
  const totalMs = Math.max(0, tick - launchTick);
  const s  = Math.floor(totalMs / 1000);
  const ms = Math.floor((totalMs % 1000) / 10); // centiseconds
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(ms)}`;
}

// Attach metT to every frame packet
for (const frame of frames) {
  frame.packet.metT = formatMetT(frame.tick);
}

// ── Group frames into WINDOW_MS tick-buckets, keep last frame per bucket ─────
// This gives real-time pacing (200ms wall clock = 200ms of tick time) while
// keeping the update rate readable instead of hammering at 45 Hz.
function buildWindows(allFrames) {
  if (!allFrames.length) return [];
  const sliced = allFrames.filter(f => f.tick >= START_TICK);
  if (!sliced.length) {
    console.warn(`START_TICK (${START_TICK}) is past all frame ticks, starting from 0`);
    return buildWindowsFrom(allFrames);
  }
  return buildWindowsFrom(sliced);
}

function buildWindowsFrom(src) {
  const windows = [];
  let windowStart = src[0].tick;
  let lastFrame   = src[0];
  for (const frame of src) {
    if (frame.tick - windowStart >= WINDOW_MS) {
      windows.push(lastFrame);
      windowStart = frame.tick;
    }
    lastFrame = frame;
  }
  windows.push(lastFrame);
  return windows;
}

const windows = buildWindows(frames);

// Integrate gyro over the playback window only (avoids pre-launch drift).
// Axis remapping: sensor gx = rocket Z (roll), sensor gz = rocket X.
{
  let rx = 0, ry = 0, rz = 0;
  let prevTick = windows[0]?.tick ?? 0;
  for (const win of windows) {
    const dt = (win.tick - prevTick) / 1000;
    prevTick = win.tick;
    rx += win.packet.gz * dt;
    ry += win.packet.gy * dt;
    rz += win.packet.gx * dt;
    win.packet.rx = rx;
    win.packet.ry = ry;
    win.packet.rz = rz;
  }
}

console.log(`Loaded ${allTicks.length} ticks → ${frames.length} merged frames`);
console.log(`Starting from tick ${START_TICK} → ${windows.length} windows to replay`);
console.log(`Tick range: ${windows[0]?.tick} ms → ${windows[windows.length-1]?.tick} ms`);
console.log(`CUHAR CSV Simulation on ws://localhost:${PORT}`);

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  console.log('Dashboard connected — starting playback');

  let idx   = 0;
  let timer = null;

  const sendNext = () => {
    if (ws.readyState !== ws.OPEN) return;

    if (idx >= windows.length) {
      process.stdout.write('\n');
      console.log('Playback complete — sending end signal, looping in 2s');
      ws.send(JSON.stringify({ playbackComplete: true }));
      idx = 0;
      timer = setTimeout(() => {
        ws.send(JSON.stringify({ playbackComplete: false }));
        sendNext();
      }, 2000);
      return;
    }

    const win  = windows[idx];
    const logicRow = logicMap.get(win.tick);
    const fs = logicRow?.flightState?.trim() || win.packet.flightState || '?';
    process.stdout.write(`\r[tick ${win.tick}]  state: ${fs.padEnd(8)}  alt: ${String(win.packet.altitude?.toFixed(1) ?? '?').padStart(8)} m  accel: ${String(win.packet.acceleration?.toFixed(2) ?? '?').padStart(7)} m/s²`);
    ws.send(JSON.stringify(win.packet));

    const nextTick  = windows[idx + 1]?.tick ?? win.tick;
    const wallDelay = Math.max(50, (nextTick - win.tick) / SPEED);
    idx++;
    timer = setTimeout(sendNext, wallDelay);
  };

  sendNext();

  ws.on('close', () => {
    clearTimeout(timer);
    console.log('Dashboard disconnected');
  });
});
