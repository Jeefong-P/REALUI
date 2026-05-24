// Telemetry packet schema — all fields expected in each JSON transmission.
//
// The sender (onboard computer / ground relay) must emit a JSON object on
// each update. Fields may be omitted; missing values are derived when
// possible or filled from INITIAL_TELEMETRY defaults.
//
// Expected JSON shape (all values SI units unless noted):
// {
//   missionTimeMs  : number   // mission elapsed time in ms
//   metT           : string   // "HH:MM:SS" pre-formatted (optional — derived from missionTimeMs)
//
//   altitude       : number   // altitude ASL in m
//   velocity       : number   // speed magnitude in m/s  (optional — derived from vx/vy/vz)
//   acceleration   : number   // acceleration magnitude in G (optional — derived from ax/ay/az)
//
//   vx, vy, vz     : number   // velocity components in m/s
//   ax, ay, az     : number   // accelerometer in m/s²
//   gx, gy, gz     : number   // gyroscope in rad/s
//
//   roll, pitch, yaw : number // attitude in rad
//   posX, posY, posZ : number // display aliases for roll/pitch/yaw (optional — derived)
//
//   lat, lon       : number   // GPS position in degrees
//   heading        : number   // compass heading 0–360 deg
//
//   flags          : number   // uint8 bitmask  bit0=gpsFix  bit1=armed  bit2=burning
//   gpsFix         : boolean  // (optional — derived from flags bit0)
//   armed          : boolean  // (optional — derived from flags bit1)
//   burning        : boolean  // (optional — derived from flags bit2)
//
//   stage          : string   // mission stage, e.g. "1"
//   burnPhase      : string   // burn phase name, e.g. "Ascent"
//   currentState   : string   // onboard state machine label
//   burnStatus     : string   // burn enable/disable text
//   pointingMode   : string   // attitude control mode
//   groundStation  : string   // active ground station ID
//
//   temp           : number   // temperature in °C
//   pressure       : number   // barometric pressure in hPa
//
//   totalDist      : number   // total distance traveled in km
//   peakAlt        : number   // peak altitude reached in m
//   signalQuality  : number   // link quality 0–100 %
//   totalPackets   : number   // total packets received (counter)
//
//   connections    : [[name, status], ...]   // subsystem connection list
//   stages         : [{ id, label, state }, ...] // mission timeline  state = "armed"|"unarmed"|"done"
// }

// ── Field name constants ───────────────────────────────────────────────────

export const F_MISSION_TIME_MS  = "missionTimeMs";
export const F_MET              = "metT";

export const F_ALTITUDE         = "altitude";
export const F_VELOCITY         = "velocity";
export const F_ACCELERATION     = "acceleration";

export const F_VX = "vx"; export const F_VY = "vy"; export const F_VZ = "vz";
export const F_AX = "ax"; export const F_AY = "ay"; export const F_AZ = "az";
export const F_GX = "gx"; export const F_GY = "gy"; export const F_GZ = "gz";

export const F_ROLL  = "roll";
export const F_PITCH = "pitch";
export const F_YAW   = "yaw";
export const F_POS_X = "posX";
export const F_POS_Y = "posY";
export const F_POS_Z = "posZ";

export const F_LAT     = "lat";
export const F_LON     = "lon";
export const F_HEADING = "heading";

export const F_FLAGS   = "flags";
export const F_GPS_FIX = "gpsFix";
export const F_ARMED   = "armed";
export const F_BURNING = "burning";

export const F_STAGE          = "stage";
export const F_BURN_PHASE     = "burnPhase";
export const F_CURRENT_STATE  = "currentState";
export const F_BURN_STATUS    = "burnStatus";
export const F_POINTING_MODE  = "pointingMode";
export const F_GROUND_STATION = "groundStation";

export const F_TEMP     = "temp";
export const F_PRESSURE = "pressure";

export const F_TOTAL_DIST     = "totalDist";
export const F_PEAK_ALT       = "peakAlt";
export const F_SIGNAL_QUALITY = "signalQuality";
export const F_TOTAL_PACKETS  = "totalPackets";

export const F_CONNECTIONS = "connections";
export const F_STAGES      = "stages";

// ── Default / initial values ───────────────────────────────────────────────

export const INITIAL_TELEMETRY = {
  [F_MISSION_TIME_MS]: 0,
  [F_MET]: "00:00:00",

  [F_ALTITUDE]: 0,
  [F_VELOCITY]: 0,
  [F_ACCELERATION]: 0,

  [F_VX]: 0, [F_VY]: 0, [F_VZ]: 0,
  [F_AX]: 0, [F_AY]: 0, [F_AZ]: 0,
  [F_GX]: 0, [F_GY]: 0, [F_GZ]: 0,

  [F_ROLL]: 0, [F_PITCH]: 0, [F_YAW]: 0,
  [F_POS_X]: 0, [F_POS_Y]: 0, [F_POS_Z]: 0,

  [F_LAT]: 0, [F_LON]: 0,
  [F_HEADING]: 0,

  [F_FLAGS]: 0,
  [F_GPS_FIX]: false,
  [F_ARMED]: false,
  [F_BURNING]: false,

  [F_STAGE]: "1",
  [F_BURN_PHASE]: "—",
  [F_CURRENT_STATE]: "—",
  [F_BURN_STATUS]: "—",
  [F_POINTING_MODE]: "—",
  [F_GROUND_STATION]: "GND",

  [F_TEMP]: 0,
  [F_PRESSURE]: 1013,

  [F_TOTAL_DIST]: 0,
  [F_PEAK_ALT]: 0,
  [F_SIGNAL_QUALITY]: 0,
  [F_TOTAL_PACKETS]: 0,

  [F_CONNECTIONS]: [
    ["AIRBRAKE", "—"],
    ["MAIN",     "—"],
    ["DROGUE",   "—"],
    ["AIRTAGS",  "—"],
  ],

  [F_STAGES]: [
    { id: 0, label: "LAUNCH",     state: "unarmed" },
    { id: 1, label: "BURNOUT",    state: "unarmed" },
    { id: 2, label: "APOGEE",     state: "unarmed" },
    { id: 3, label: "DROGUE",     state: "unarmed" },
    { id: 4, label: "MAIN CHUTE", state: "unarmed" },
    { id: 5, label: "LANDED",     state: "unarmed" },
  ],
};

// ── JSON packet parser ─────────────────────────────────────────────────────

const G = 9.80665;

// Parse a raw JSON string (or pre-parsed object) from the telemetry stream.
// Derives missing fields from available data, then merges with INITIAL_TELEMETRY.
export function parsePacket(raw) {
  const p = typeof raw === "string" ? JSON.parse(raw) : { ...raw };

  // Derive metT from missionTimeMs when omitted
  if (p[F_MISSION_TIME_MS] !== undefined && p[F_MET] === undefined) {
    const t = p[F_MISSION_TIME_MS] / 1000;
    p[F_MET] = [
      Math.floor(t / 3600),
      Math.floor((t % 3600) / 60),
      Math.floor(t % 60),
    ].map((n) => String(n).padStart(2, "0")).join(":");
  }

  // Derive attitude display aliases from roll/pitch/yaw when omitted
  if (p[F_POS_X] === undefined && p[F_ROLL]  !== undefined) p[F_POS_X] = p[F_ROLL];
  if (p[F_POS_Y] === undefined && p[F_PITCH] !== undefined) p[F_POS_Y] = p[F_PITCH];
  if (p[F_POS_Z] === undefined && p[F_YAW]   !== undefined) p[F_POS_Z] = p[F_YAW];

  // Derive velocity magnitude from components when omitted
  if (p[F_VELOCITY] === undefined &&
      p[F_VX] !== undefined && p[F_VY] !== undefined && p[F_VZ] !== undefined) {
    p[F_VELOCITY] = +Math.hypot(p[F_VX], p[F_VY], p[F_VZ]).toFixed(2);
  }

  // Derive acceleration in G from components when omitted
  if (p[F_ACCELERATION] === undefined &&
      p[F_AX] !== undefined && p[F_AY] !== undefined && p[F_AZ] !== undefined) {
    p[F_ACCELERATION] = +(Math.hypot(p[F_AX], p[F_AY], p[F_AZ]) / G).toFixed(3);
  }

  // Derive flag booleans from bitmask when omitted
  if (p[F_FLAGS] !== undefined) {
    if (p[F_GPS_FIX] === undefined) p[F_GPS_FIX] = (p[F_FLAGS] & 0x01) !== 0;
    if (p[F_ARMED]   === undefined) p[F_ARMED]   = (p[F_FLAGS] & 0x02) !== 0;
    if (p[F_BURNING] === undefined) p[F_BURNING] = (p[F_FLAGS] & 0x04) !== 0;
  }

  return { ...INITIAL_TELEMETRY, ...p };
}

// ── Serial frame parser ────────────────────────────────────────────────────
// Accumulates bytes from the serial port and emits one parsed packet per
// newline-terminated JSON line. Non-JSON lines (e.g. debug prints) are
// silently skipped.

export class FrameParser {
  constructor(onPacket, onError) {
    this._buf      = "";
    this._onPacket = onPacket;
    this._onError  = onError;
  }

  push(chunk) {
    this._buf += chunk.toString("utf8");
    const lines = this._buf.split("\n");
    this._buf = lines.pop(); // keep any incomplete trailing data
    for (const line of lines) {
      const s = line.trim();
      if (!s || !s.startsWith("{")) continue; // skip blank / debug lines
      try {
        this._onPacket(JSON.parse(s));
      } catch (e) {
        this._onError(e.message);
      }
    }
  }
}

// Alias kept for receiver.js import — converts a raw parsed object to the
// full telemetry shape (derives missing fields, merges defaults).
export function toTelemetry(pkt) {
  return parsePacket(pkt);
}
