# Frontend Data Wiring — To-Do

> Last audited: 2026-05-30. All wirable items are complete. Only design-decision-blocked items remain.

---

## ✅ Completed (verified in code)

- [x] Altitude unit in `OnFlight.jsx` — shows `m`, hardware sends meters
- [x] `MissionTimeline` receives `telemetry.stages` prop — stage dots reflect INITIAL state labels
- [x] `CoordAxes` wired to `gx/gy/gz` — mock animation suppressed when hardware streams gyro data
- [x] `roll`, `pitch`, `yaw` added to `REAL_FIELDS` — accepted if hardware sends them (higher priority than gyro in waterfall)
- [x] `totalPackets` counter in `useTelemetry.jsx` — incremented on every valid packet, available as `telemetry.totalPackets`
- [x] `lat`/`lon` accumulated in `samplesRef` in `App.jsx` — final position preserved in samples
- [x] `totalDist` Haversine accumulation in `App.jsx` — km accumulated during onflight, exposed as `telemetry.totalDist`
- [x] `local` object field names in `PostFlight.jsx` — already uses `altitude`, `velocity`, `acceleration`
- [x] `Trajectory` component — reads `telemetry.altitude` / `telemetry.velocity`
- [x] `MissionClock` — shows `telemetry.metT`
- [x] `DonutGauges` in `SensorGraphs` — peak temp % of sensor max, min pressure % of sea level
- [x] `Groundstation` panel — removed from PostFlight layout

---

## ❌ Blocked on design decisions (not wiring problems)

- **PostFlight stage event times** — `MissionClock` event cells show `T+--:--:--`. Need either hardware to emit event timestamps, or `App.jsx` to record wall-clock times when stage transitions are detected (requires firmware changes or a separate event stream).

- **`stage` / `burnPhase` / `currentState`** — not sent by hardware. Currently always show INITIAL defaults (`"1"`, `"Ascent"`, `"NOMINAL"`). Decide: should the firmware emit these, or should the frontend derive them from the `flightState` field in `flightLogic.csv`? If derived from CSV, `simulation.js` would need to map `flightState` → `stage`/`burnPhase` and include them in the broadcast packet.

- **SensorDetail** — MATLAB graph slot in PostFlight. Stays as an image/export placeholder or becomes a live chart component?

- **SensorGraphs upper graph** — placeholder labeled "SOME GRAPH". Decide what goes here.

- **GraphTriple A/B/C** — three unnamed graph slots. Decide what each shows before building.

- **MissionTimeline labels** — the `MissionTimeline` component's DEFAULT_STAGES has placeholder `"xxx"` labels for stages 1–4. These are overridden at runtime by `INITIAL.stages` from `useTelemetry.jsx` (LAUNCH / BURNOUT / APOGEE / DROGUE / MAIN CHUTE / LANDED). Confirm these are the final names.

- **PreFlight bubble overlays** — all data rows show `"PHD"`. Decide what subsystem values go in each bubble before wiring.
