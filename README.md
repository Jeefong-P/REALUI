# CUHAR-OG — AI Context File

This file is for AI assistants. It describes the full architecture, data flow, component roles, known WIP areas, and conventions across this project so you can make correct, context-aware edits without misreading intent.

---

## What This Project Is

Ground station UI and telemetry pipeline for the CUHAR rocket project (team CURSR-V / TEAM-213). The system receives live radio telemetry from the rocket via LoRa, routes it through a Node.js WebSocket server, and displays it on a React dashboard with three flight-phase views: Pre-Flight, On-Flight, Post-Flight.

---

## Repository Layout

```
CUHAR-OG/
├── arduino/
│   ├── cuhar_telemetry/cuhar_telemetry.ino   — main onboard telemetry sketch (stub)
│   ├── lora_receiver/lora_receiver.ino        — LoRa ground receiver (stub)
│   └── lora_sender/lora_sender.ino            — LoRa transmitter onboard (stub)
│
├── CUHAR-TelemetryUI-backend/
│   ├── server.js            — MAIN backend: reads serial → broadcasts WebSocket on port 9001
│   ├── simulation.js        — dev-only: replays CSV flight data, broadcasts on port 9003
│   ├── signaling_server.js  — WebRTC signaling relay, also on port 9003 (separate use case)
│   ├── receiver.js          — supporting script
│   ├── client.js            — supporting script
│   ├── packet.js            — canonical telemetry schema + field constants + parsePacket()
│   ├── bmi088acc.csv        — logged accelerometer data (tick, accX, accY, accZ) in m/s²
│   ├── bmi088gyro.csv       — logged gyroscope data (tick, gx, gy, gz) in rad/s
│   ├── gnss.csv             — logged GPS data (tick, latitude, longitude, altitude, satelliteCount, fix, time, speed, course)
│   ├── ms5607.csv           — logged barometer data (tick, temperature, pressure) — raw units: temp in 0.01°C, pressure in Pa
│   ├── flightLogic.csv      — logged flight state machine output (tick, flightState, filtered_altitude, filtered_acceleration)
│   ├── package.json
│   └── .gitignore
│
└── vehicle-dashboard/       — React + Vite frontend
    ├── src/
    │   ├── App.jsx                    — root shell, phase state, video transition logic, totalDist accumulation
    │   ├── hooks/useTelemetry.jsx     — WebSocket hook, reconnects automatically, totalPackets counter
    │   ├── pages/
    │   │   ├── PreFlight.jsx          — pre-launch view (partly placeholder)
    │   │   ├── OnFlight.jsx           — live flight view (altitude, velocity, accel gauges, CoordAxes wired to gx/gy/gz)
    │   │   └── PostFlight.jsx         — post-mission review (FlightSummary fully wired, others partial)
    │   └── components/
    │       ├── TopBar.jsx / .css      — header bar with phase label
    │       ├── IconBar.jsx            — bottom icon row
    │       ├── LeftData.jsx           — left panel, live telemetry fields
    │       ├── LeftList.jsx           — left list panel
    │       ├── RightData.jsx          — live video feed panel (expandable, currently NO SIGNAL)
    │       ├── RightList.jsx          — right list panel
    │       ├── ModelZone.jsx          — 3D rocket model (CURSR_V_10.glb via Three.js/R3F)
    │       ├── ArcGauge.jsx           — arc-style gauge (reusable)
    │       ├── at_and_speedom.jsx     — velocity + acceleration gauge used in OnFlight
    │       ├── LoopGauge.jsx          — circular loop gauge
    │       ├── CoordAxes.jsx          — 3D rocket orientation model (accepts rx/ry/rz in radians or degrees; useFrame exponential smoothing)
    │       ├── FlightGraphs.jsx       — Recharts line graphs for PostFlight (Altitude, Velocity, Acceleration, Temp+Pressure)
    │       ├── Clock.jsx              — mission clock display
    │       ├── MissionTimeline.jsx    — vertical stage timeline (LAUNCH → LANDED), takes stages prop
    │       └── StatusBar.jsx          — system status indicator row
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Data Flow

```
Rocket (LoRa TX)
    │  radio
    ▼
Arduino LoRa Receiver (ground)
    │  USB serial  COM11  115200 baud
    ▼
CUHAR-TelemetryUI-backend/server.js
    │  newline-delimited JSON over WebSocket  ws://localhost:9001
    ▼
vehicle-dashboard/src/hooks/useTelemetry.jsx
    │  React state merge  { ...prev, ...incoming }
    ▼
All pages/components via telemetry prop
```

For development without hardware, replace `server.js` with `simulation.js` (port 9003) and change `DEFAULT_URL` in `useTelemetry.jsx` from `9001` to `9003`. The simulation replays the five CSV files in lock-step using a 200ms tick window.

---

## Telemetry Packet Schema

The real hardware sends these fields over WebSocket (JSON, newline-terminated). `useTelemetry.jsx` whitelists exactly these via `REAL_FIELDS` — anything else is silently ignored.

### Real hardware fields (wire format)
```json
{
  "lat":          13.736717,
  "lon":          100.523186,
  "heading":      270,
  "gpsFix":       true,

  "altitude":     1200.5,
  "velocity":     340.0,
  "acceleration": 3.2,

  "temp":         22.5,
  "pressure":     1013.25,

  "ax": 0.12,  "ay": 9.8,  "az": 0.04,
  "gx": 0.01,  "gy": 0.0,  "gz": 0.02,

  "roll":  0.0, "pitch": 0.05, "yaw": 1.57,

  "metT":  "00:01:23"
}
```

- `ax/ay/az` — BMI088 accelerometer in **m/s²**
- `gx/gy/gz` — BMI088 gyroscope in **rad/s**
- `roll/pitch/yaw` — attitude angles in **radians** (optional — hardware may derive these or omit them)
- `altitude` — filtered altitude in **meters** (from flightLogic, not raw barometer)
- `temp` — **°C** (simulation divides raw 0.01°C units by 100)
- `pressure` — **hPa** (simulation divides raw Pa units by 100)
- `velocity` — GPS ground speed in **m/s**
- `acceleration` — filtered magnitude in **m/s²** (from flightLogic filtered_acceleration)

### CSV sensor files (simulation source)

| File | Columns | Units |
|---|---|---|
| `bmi088acc.csv` | tick, accX, accY, accZ | m/s² |
| `bmi088gyro.csv` | tick, gx, gy, gz | rad/s |
| `gnss.csv` | tick, latitude, longitude, altitude, satelliteCount, fix, time, speed, course | deg, m, bool, HH:MM.S, m/s, deg |
| `ms5607.csv` | tick, temperature, pressure | 0.01°C, Pa (divided by 100 before sending) |
| `flightLogic.csv` | tick, flightState, filtered_altitude, filtered_acceleration | —, m, m/s² |

`flightState` values in `flightLogic.csv`: `IDLE`, and flight phases thereafter (LAUNCH, BURNOUT, APOGEE, DROGUE, MAIN_CHUTE, LANDED). The simulation uses the first non-IDLE tick as T+0 for `metT` formatting.

### Fields NOT from hardware (stay at defaults in state)
All other fields (`stages`, `connections`, `burnPhase`, `currentState`, `burnStatus`, `pointingMode`, `groundStation`, `missionTimeMs`, `armed`, `burning`, `stage`, etc.) are display-only. They keep their default values from `INITIAL` in `useTelemetry.jsx` and must be managed manually when needed. `totalPackets` is incremented client-side by the hook. `totalDist` is accumulated client-side in `App.jsx` using the Haversine formula during the onflight phase.

---

## Flight Phases

The app has three phases controlled by `phase` state in `App.jsx`. The user cycles them in dev by pressing `Y` (preflight → onflight) and `C` (onflight → postflight).

| Phase       | Component     | Status |
|-------------|---------------|--------|
| `preflight` | PreFlight.jsx | Partially built. Layout has 3D model, bubble overlays with labels, but bubble data rows show "PHD" (placeholder). LeftData + RightList functional. |
| `onflight`  | OnFlight.jsx  | Fully wired. T+, stage, systemStatus, altitude (m), pressure, velocity gauge, accel gauge, temp bar, CoordAxes (gx/gy/gz), MissionTimeline (stages). |
| `postflight`| PostFlight.jsx| Mixed. FlightSummary fully wired. MissionClock shows metT. Trajectory shows lat/lon. Graph slots (SensorDetail, SensorGraphs, GraphTriple) are intentional placeholders pending design decisions. |

### Phase transition animation (App.jsx)
When `Y` is pressed, the `RightData` video panel (`.video-persistent`) animates:
1. Zooms out to fullscreen over 700ms
2. Racing countdown plays: **3 → 2 → 1 → BOOST** (600ms each, BOOST holds 1500ms)
3. Page switches (`renderedPhase` updates)
4. Shrinks back into the new page's `.video-slot` over 1300ms

The `.video-slot` div is a layout placeholder in each page — the actual video div lives absolutely positioned in App and is animated to match the slot's rect using `getBoundingClientRect()`.

### PreFlight activation
- Clicking the **ACTIVATE** button (or pressing `X`) in PreFlight triggers two things simultaneously:
  1. `LeftList` starts its cascade sequence (WAITING → LOADING → READY, staggered 400ms per item)
  2. `IconBar` receives `preflightActive=true` → all icons turn green
- `App.jsx` holds `preflightActive` state; `onActivate` callback passed to `PreFlight`
- Individual icons in `IconBar` can also be manually toggled green by clicking (selectable icons only: Telemetry, Live Feed, GPS, Comms)
- Non-selectable icons (Data Log, Thermal, Attitude, Orbit) only go green when `preflightActive` fires

---

## WebSocket Ports

| Port | File                 | Purpose                                      |
|------|----------------------|----------------------------------------------|
| 9001 | server.js            | Live serial→WebSocket relay (production)     |
| 9003 | simulation.js        | Simulated telemetry for testing (no hardware)|
| 9003 | signaling_server.js  | WebRTC signaling relay (separate feature)    |

Note: `simulation.js` and `signaling_server.js` conflict on port 9003. They are not meant to run simultaneously.

---

## useTelemetry Hook

`vehicle-dashboard/src/hooks/useTelemetry.jsx`

- Connects to `ws://localhost:9001` by default (`DEFAULT_URL`)
- Auto-reconnects every 1 second on disconnect
- Returns `{ telemetry, connected, live }`
  - `connected` = WebSocket is open
  - `live` = data received within the last 1500ms (`STALE_MS`)
  - `telemetry` = merged state object (prev + incoming, never resets to INITIAL on reconnect)
- Incoming packets are whitelisted by `REAL_FIELDS` — only accepted keys are merged into state
- `totalPackets` is incremented on every accepted packet (client-side counter, not from hardware)
- Malformed JSON frames are silently dropped

In `App.jsx`, the derived/augmented fields added on top of raw telemetry before passing to pages:
```js
systemStatus:   streaming ? "NOMINAL" : connected ? "WAITING" : "NO"
gpsStatus:      live.gpsFix ? "GPS ▲" : "GPS ▽"
velocityFooter: `${Math.round(live.velocity)} m/s`
totalDist:      accumulated km via Haversine during onflight (state in App, resets each flight)
```

---

## CoordAxes Attitude Wiring

`CoordAxes` accepts `rx`, `ry`, `rz` as radians (or degrees if |value| > 2π) and rotates the 3D rocket model.

`OnFlight.jsx` resolves attitude through a priority waterfall. Highest priority sources win:
```
orientation.rx → orientation.roll → rx → roll → posX → gx  →  mockAttitude.rx (fallback)
orientation.ry → orientation.pitch → ry → pitch → posY → gy  →  mockAttitude.ry
orientation.rz → orientation.yaw  → rz → yaw   → posZ → gz  →  mockAttitude.rz
```

`gx/gy/gz` (gyroscope in rad/s) are the last hardware-sourced candidates. When the hardware sends them, the mock animation is suppressed and the model responds to real rotational rates. If the hardware additionally sends `roll/pitch/yaw` (absolute angles in radians), those will win over gyro values automatically.

---

## totalDist Accumulation

`App.jsx` accumulates flight distance in km using the Haversine formula during the onflight phase. Rules:
- Only accumulates when `live.gpsFix === true`
- Jumps > 50 km between frames are discarded (GPS noise guard)
- Resets to 0 when entering the onflight phase
- Exposed as `telemetry.totalDist` (km) to all child components

---

## flightStats — what is accumulated

`App.jsx` pushes to `samplesRef` on every telemetry update during onflight:
```js
{ altitude, velocity, acceleration, temp, pressure, lat, lon, metT }
```
`computeFlightStats` processes altitude/velocity/acceleration/temp/pressure into avg/max/min per field → `flightStats` prop passed to `PostFlight`. `lat`/`lon`/`metT` are in the samples array but not summarized — lat/lon available for future map/path features, metT used as the X axis for flight graphs.

At postflight transition, `samplesRef.current` is frozen into `flightSamples` state (`setFlightSamples([...samplesRef.current])`) and passed to `PostFlight` as the graph data source. `samplesRef` is then cleared.

---

## Components Added

### Popups.jsx (`vehicle-dashboard/src/components/Popups.jsx`)
Exports four ready-to-use popup components. All close on Escape key or clicking the backdrop.
- `AlertPopup({ title, message, onClose })` — info only, one OK button
- `ConfirmPopup({ title, message, onConfirm, onClose })` — confirm/cancel
- `StatusPopup({ title, items, onClose })` — list of `{ label, value, ok }` rows (ok: true=green, false=red)
- `WarningPopup({ title, message, onClose })` — red accent with ⚠ icon, ACKNOWLEDGE button

### FlightGraphs.jsx (`vehicle-dashboard/src/components/FlightGraphs.jsx`)
Exports four Recharts-based line graph components for the PostFlight page. All use `ResponsiveContainer` and fill their parent container. Data is downsampled to 400 points max. Animations are disabled (`isAnimationActive={false}`) for instant render on page load.
- `AltitudeGraph({ samples })` — altitude (m) vs metT, gold line
- `VelocityGraph({ samples })` — velocity (m/s) vs metT, blue line
- `AccelerationGraph({ samples })` — acceleration (m/s²) vs metT, red line
- `TempPressureGraph({ samples })` — temp (°C) left axis + pressure (hPa) right axis vs metT, dual line

`samples` is the frozen `flightSamples` array captured at postflight transition in `App.jsx`. Each sample is `{ altitude, velocity, acceleration, temp, pressure, lat, lon, metT }`.

---

## Known WIP / Placeholder Areas

- **PreFlight bubble overlays** — all data rows show `"PHD"`. These need real subsystem values wired in.
- **PostFlight map** — `Trajectory` panel has a MAP placeholder. Candidate implementation: Google Maps JS API (requires API key + internet) or Leaflet + OpenStreetMap (works offline).
- **PostFlight stage event times** — `MissionClock` event grid (Apogee Time, Drogue Deploy, Main Chute, Boost Start) shows `T+--:--:--`. Timestamps ARE now tracked for BOOST/APOGEE/DROGUE/MAIN via `eventTimes` state in `App.jsx`; the `FlightTimeline` component in PostFlight does not display them yet (still shows placeholder).
- **stage / burnPhase / currentState** — not sent by hardware; always show INITIAL defaults (`"1"`, `"—"`, `"—"`). Must be derived from `flightState` in `flightLogic.csv` or emitted as separate fields from the onboard firmware.
- **MissionTimeline stage labels** — MissionTimeline.jsx default labels are placeholders (`"xxx"`). The real labels come from `INITIAL.stages` in `useTelemetry.jsx`: LAUNCH, BURNOUT, APOGEE, DROGUE, MAIN CHUTE, LANDED.
- **RightData video** — `<video>` tag is replaced with `NO SIGNAL` div. WebRTC integration is pending.
- **Arduino sketches** — all three `.ino` files are stubs. Firmware not yet implemented here.
- **signaling_server.js** — uses `WebSocket.OPEN` which requires `ws` package to expose that constant as a global; may have a runtime bug depending on import style.

---

## Wiring Status — Final State (as of 2026-05-30)

### OnFlight.jsx

| Component / Field | Wired | Notes |
|---|---|---|
| T+ MET | ✅ | `telemetry.metT` — hardware sends it |
| Stage | ❌ | Not from hardware; stays at INITIAL `"1"` |
| Burn Phase | ❌ | Not from hardware; stays at INITIAL `"—"` |
| Status | ✅ | Derived in App.jsx from connection state |
| MissionTimeline | ✅ | Receives `telemetry.stages`; stages not updated by hardware |
| Altitude (value) | ✅ | `telemetry.altitude` — hardware sends it |
| Altitude (unit) | ✅ | Shows `m` — hardware sends meters |
| Pressure | ✅ | `telemetry.pressure` — hardware sends it |
| Velocity gauge | ✅ | `telemetry.velocity` |
| Acceleration gauge | ✅ | `telemetry.acceleration` |
| Temp bar | ✅ | `telemetry.temp` |
| CoordAxes | ✅ | Uses `gx/gy/gz` (angular rate); falls to mock only if hardware sends all zeros and no roll/pitch/yaw |

### PostFlight.jsx

| Component / Field | Wired | Notes |
|---|---|---|
| FlightSummary — all rows | ✅ | From `flightStats` (avg/max/min accumulated during onflight) |
| MissionClock — flight time | ✅ | `telemetry.metT` — last received value |
| MissionClock — event times | ❌ | Placeholder `T+--:--:--`; no event timestamp tracking yet |
| Trajectory — lat/lon | ✅ | `telemetry.lat/lon` — last received values |
| Trajectory — alt/vel | ✅ | `telemetry.altitude` / `telemetry.velocity` — correct key names |
| SensorGraphs — DonutGauges | ✅ | Peak temp % of sensor max, min pressure % of sea level (from flightStats) |
| SensorDetail — Altitude vs Time | ✅ | `AltitudeGraph` from `FlightGraphs.jsx`, fed from `flightSamples` |
| GraphTriple — Velocity vs Time | ✅ | `VelocityGraph` from `FlightGraphs.jsx` |
| GraphTriple — Acceleration vs Time | ✅ | `AccelerationGraph` from `FlightGraphs.jsx` |
| GraphTriple — Temp & Pressure | ✅ | `TempPressureGraph` from `FlightGraphs.jsx`, dual y-axis |
| SensorGraphs — placeholder removed | ✅ | Upper placeholder deleted; two DonutGauges now fill the full panel |
| Trajectory — map | ❌ | MAP placeholder — Google Maps / Leaflet pending |
| totalPackets | ✅ | Counted in useTelemetry, available as `telemetry.totalPackets` |
| totalDist | ✅ | Haversine-accumulated in App.jsx, available as `telemetry.totalDist` (km) |

---

## How to Run

### Backend (real hardware)
```bash
cd CUHAR-TelemetryUI-backend
npm install
node server.js         # serial on COM11, WS on :9001
```

### Backend (simulation, no hardware)
```bash
node simulation.js     # replays CSV files, WS on :9003
# then change DEFAULT_URL in useTelemetry.jsx to ws://localhost:9003
```

### Dashboard
```bash
cd vehicle-dashboard
npm install
npm run dev            # http://localhost:5173
```

Press `Y` in the browser to transition preflight → onflight (with zoom animation).
Press `C` during onflight to cut to postflight and compute flightStats.

---

## Conventions & Gotchas

- All telemetry values use SI units: meters, m/s, m/s², rad/s, rad, °C, hPa, degrees for lat/lon/heading.
- `acceleration` on the wire is `filtered_acceleration` from flightLogic in **m/s²**, not G-force. `packet.js` `parsePacket()` can derive G-force from ax/ay/az if acceleration is omitted.
- `gx/gy/gz` are in **rad/s** (angular velocity), not angles. `roll/pitch/yaw` (if sent) are absolute angles in **radians**.
- `heading` is in **degrees** (0–360, from GPS course).
- `stages[].state` is one of `"armed"` | `"unarmed"` | `"done"`.
- `totalDist` is in **km** (Haversine output).
- The 3D model asset is `vehicle-dashboard/src/assets/CURSR_V_10.glb` (CURSR rocket, version 10).
- Font used throughout UI: **Rajdhani** (display), **Share Tech Mono** (numeric readouts).
- CSS variables for colors: `--green`, `--gold2`, `--crim2`, `--bright` — defined in `index.css`.
- The simulation starts playback at `START_TICK = 3120000` (milliseconds) to skip past the IDLE pre-launch period. Change this constant in `simulation.js` to replay from a different point in the CSV data. Playback ends when `flightLogic.csv` data runs out (`lastLogicTick`), regardless of how long other CSV files (e.g. `gnss.csv`) extend.
- **Stale closure trap** — any `useEffect` with `[]` deps cannot safely read `live` (telemetry state). Use `liveRef.current` instead. `liveRef` is updated on every render in `App.jsx` and always holds the current telemetry.
- **postflight snapshot** — at the onflight→postflight transition, `App.jsx` freezes three things: `snapshotMetT` (final metT string), `snapshotTelemetry` (full telemetry object), `flightSamples` (full samples array). PostFlight receives all three and never reads live telemetry — this prevents the GNSS/metT from continuing to update after the flight ends.
- **`playbackComplete` cycling** — the simulation sends `{ playbackComplete: true }`, waits 2s, then sends `{ playbackComplete: false }` before looping. This is required because the React `useEffect([live.playbackComplete])` only fires on value *change* — if `true` was never reset to `false`, the second loop completion would not trigger the postflight transition.

---

## Changes Log (2026-06-03)

### `CoordAxes.jsx` — smooth rocket model animation
Replaced direct prop-based rotation with `useFrame` exponential smoothing. The model now interpolates at 60fps between discrete telemetry updates instead of jumping frame-to-frame.
- Added `groupRef` and `targetRef` refs to `Scene`
- `useFrame` applies `k = 1 - Math.exp(-8 * delta)` lerp each frame (frame-rate independent, ~8 rad/s convergence)

### `simulation.js` — correct playback end point
- Added `lastLogicTick` (safe loop, not spread) to find the final tick in `flightLogic.csv`
- `buildFrames()` now `break`s when `tick >= lastLogicTick` — simulation ends with flight logic data regardless of GNSS or other CSV length
- `sendNext()` now cycles `playbackComplete: true → false` before looping so the React postflight effect re-fires on each completion

### `App.jsx` — postflight data freeze + graph data collection
- Added `snapshotTelemetry` state: captures `{ ...live }` at transition time, passed to PostFlight so displayed values are frozen at last real flight data
- Added `liveRef` ref: always holds current `live` telemetry — fixes the stale closure in the `'c'` key handler (`[]` deps effect)
- Added `flightSamples` state: frozen copy of `samplesRef` at transition, passed to PostFlight for graph rendering
- Added `metT` field to each pushed sample (used as graph X axis)
- All three frozen values reset to null/empty when re-entering onflight

### `PostFlight.jsx` — flight graphs wired, sensor summary cleaned up
- `SensorDetail` panel: replaced MATLAB placeholder with `AltitudeGraph`
- `GraphTriple`: replaced three placeholder panels with `VelocityGraph`, `AccelerationGraph`, `TempPressureGraph`
- `SensorGraphs`: removed upper "SOME GRAPH" placeholder; two DonutGauges now fill the full panel height
- Titles updated: "SENSOR DETAIL" → "ALTITUDE vs TIME", graph panels titled accordingly

### `FlightGraphs.jsx` — new component
Created `vehicle-dashboard/src/components/FlightGraphs.jsx`. Four Recharts line graph components, all using `ResponsiveContainer` + dark theme styling. Installed `recharts` package.

---

## AI Errors & Misunderstandings

This section documents mistakes made during AI-assisted development so future sessions don't repeat them.

### 1. `RangeError: Maximum call stack size exceeded` — spread on large Map
**What happened:** Used `Math.max(...logicMap.keys())` to find the max tick. `logicMap` had ~500,000 keys, spreading them into a variadic function overflowed the call stack.
**Fix:** Loop: `for (const k of logicMap.keys()) { if (k > lastLogicTick) lastLogicTick = k; }`
**Rule:** Never spread a large iterable into a variadic function. Use a loop.

### 2. Left over `lastLogicTick` variable after being asked to revert
**What happened:** User asked to revert the flightLogic-end fix. The `lastLogicTick` declaration was removed but the `break` line that referenced it was left in, causing a ReferenceError.
**Fix:** Always verify that ALL lines referencing a removed variable are also removed.

### 3. Misidentified root cause of metT/GNSS showing zeros on postflight
**What happened:** User reported metT and lat/lon showing zeros on the PostFlight page after both the snapshot fix and graph implementation were applied in the same session. Incorrectly assumed the graph changes caused it and spent time looking for a bug there.
**Actual cause:** The `'c'` key handler `useEffect` has `[]` as its dependency array, which means it is set up once at mount and closes over the initial `live` value (`metT: "00:00:00"`, `lat: 0`, `lon: 0`). The snapshot fix added `setSnapshotTelemetry({ ...live })` inside that stale closure — it always captured initial values.
**Fix:** Added `liveRef` (updated every render) and used `liveRef.current` inside the stale-closure handler.

### 4. `playbackComplete` stuck at `true` — effect never re-fires
**What happened:** After the first simulation loop completed and `playbackComplete` was set to `true`, subsequent loop completions did not trigger the postflight transition. The `useEffect([live.playbackComplete])` only fires when the value *changes* — sending `true` again when state is already `true` is a no-op.
**Fix:** Simulation sends `{ playbackComplete: false }` before restarting the loop, cycling the value so the effect always gets a genuine change.

### 5. `gnss.csv` extends 10× longer than other CSVs — caused simulation to never end
**What happened:** `gnss.csv` ticks ran to ~40,000,000 while all other CSVs ended at ~4,000,000. The simulation was using all unique ticks from all sources, so playback continued for 10× the actual flight duration.
**Fix:** `buildFrames()` breaks at `lastLogicTick` (end of flightLogic data). The simulation now ends exactly when the flight state machine data ends.
