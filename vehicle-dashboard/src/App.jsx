import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import IconBar from "./components/IconBar";
import RightData from "./components/RightData";
import PreFlight from "./pages/PreFlight";
import OnFlight from "./pages/OnFlight";
import PostFlight from "./pages/PostFlight";
import useTelemetry from "./hooks/useTelemetry";

const PHASES = ["preflight", "onflight", "postflight"];

const STAT_FIELDS = ["altitude", "velocity", "acceleration", "temp", "pressure"];

function computeFlightStats(samples) {
  if (!samples.length) return null;
  const result = {};
  for (const field of STAT_FIELDS) {
    const vals = samples.map((s) => s[field]).filter((v) => Number.isFinite(v));
    if (!vals.length) { result[field] = null; continue; }
    const sum = vals.reduce((a, b) => a + b, 0);
    result[field] = { avg: sum / vals.length, max: Math.max(...vals), min: Math.min(...vals) };
  }
  return result;
}
const PHASE_LABELS = {
  preflight:  "PRE-FLIGHT",
  onflight:   "ON-FLIGHT",
  postflight: "POST-FLIGHT",
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const FLIGHT_SEQUENCE = ['BOOST', 'COAST', 'APOGEE', 'DROGUE', 'MAIN'];

function stagesFromFlightState(fs) {
  const idx = FLIGHT_SEQUENCE.indexOf(fs);
  return FLIGHT_SEQUENCE.map((label, i) => ({
    id: i,
    label,
    state: idx < 0 ? "unarmed" : i < idx ? "done" : i === idx ? "armed" : "unarmed",
  }));
}

const FLIGHT_STATE_DISPLAY = {
  BOOST:  { stage: "1", burnPhase: "Ascent" },
  COAST:  { stage: "2", burnPhase: "Coast" },
  APOGEE: { stage: "3", burnPhase: "Apogee" },
  DROGUE: { stage: "4", burnPhase: "Descent" },
  MAIN:   { stage: "5", burnPhase: "Recovery" },
};

const FLIGHT_STATE_ALERTS = {
  APOGEE: { id: "apogee", label: "APOGEE REACHED",    sub: "MAX ALTITUDE CONFIRMED",     color: "gold"   },
  DROGUE: { id: "drogue", label: "DROGUE DEPLOY",     sub: "STABILIZATION CHUTE ACTIVE", color: "orange" },
  MAIN:   { id: "chute",  label: "MAIN CHUTE DEPLOY", sub: "RECOVERY SEQUENCE ACTIVE",   color: "green"  },
};

const ZOOM_OUT_MS = 700;
const SHRINK_MS   = 1300;

const COUNTDOWN_STEPS = [
  { label: "3",     ms: 600 },
  { label: "2",     ms: 600 },
  { label: "1",     ms: 600 },
  { label: "BOOST", ms: 1500 },
];

function getSlotRect() {
  const slot = document.querySelector(".video-slot");
  return slot ? slot.getBoundingClientRect() : null;
}

function applyRect(el, r) {
  el.style.top    = r.top    + "px";
  el.style.left   = r.left   + "px";
  el.style.width  = r.width  + "px";
  el.style.height = r.height + "px";
}

function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function App() {
  const [phase, setPhase] = useState("preflight");
  const [renderedPhase, setRenderedPhase] = useState("preflight");
  const [countdown, setCountdown] = useState(null); // null | "3" | "2" | "1" | "BOOST"
  const [preflightActive, setPreflightActive] = useState(false);
  const [flightAlerts, setFlightAlerts] = useState([]);
  const [flightStats, setFlightStats] = useState(null);
  const [totalDist, setTotalDist] = useState(0);
  const [snapshotMetT, setSnapshotMetT] = useState(null);
  const [snapshotTelemetry, setSnapshotTelemetry] = useState(null);
  const [flightSamples, setFlightSamples] = useState([]);
  const [eventTimes, setEventTimes] = useState({});

  const samplesRef = useRef([]);
  const renderedPhaseRef = useRef("preflight");
  const liveRef = useRef(null);
  const prevLatLonRef = useRef(null);
  const prevFlightStateRef = useRef(null);
  const launchTriggeredRef = useRef(false);

  const videoRef        = useRef(null);
  const isFirstRenderRef = useRef(true);
  const transitioningRef = useRef(false);

  const { telemetry: live, connected, live: streaming } = useTelemetry();
  liveRef.current = live;
  const stateDisplay = FLIGHT_STATE_DISPLAY[live.flightState] || {};
  const telemetry = {
    ...live,
    systemStatus:   streaming ? "NOMINAL" : connected ? "WAITING" : "NO",
    gpsStatus:      live.gpsFix ? "GPS ▲" : "GPS ▽",
    velocityFooter: `${Math.round(live.velocity)} m/s`,
    totalDist,
    stage:     stateDisplay.stage     ?? live.stage,
    burnPhase: stateDisplay.burnPhase ?? live.burnPhase,
    stages:    stagesFromFlightState(live.flightState),
  };

  useLayoutEffect(() => {
    if (!isFirstRenderRef.current) return;
    const v = videoRef.current;
    const r = getSlotRect();
    if (v && r) applyRect(v, r);
    isFirstRenderRef.current = false;
  }, []);

  useEffect(() => {
    if (phase === renderedPhase) return;
    if (transitioningRef.current) return;

    const v = videoRef.current;
    if (!v) return;

    const run = async () => {
      transitioningRef.current = true;

      const fsW = window.innerWidth;
      const fsH = window.innerHeight;
      const oldRect = v.getBoundingClientRect();

      v.style.top    = "0px";
      v.style.left   = "0px";
      v.style.width  = fsW + "px";
      v.style.height = fsH + "px";

      const a1 = v.animate(
        [
          { top: oldRect.top + "px", left: oldRect.left + "px", width: oldRect.width + "px", height: oldRect.height + "px" },
          { top: "0px", left: "0px", width: fsW + "px", height: fsH + "px" },
        ],
        { duration: ZOOM_OUT_MS, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      );

      await a1.finished;

      // Racing countdown before switching page
      for (const { label, ms } of COUNTDOWN_STEPS) {
        setCountdown(label);
        await wait(ms);
      }
      setCountdown(null);
      await nextFrame();

      setRenderedPhase(phase);

      let newRect = null;
      for (let i = 0; i < 10; i++) {
        await nextFrame();
        newRect = getSlotRect();
        if (newRect) break;
      }

      if (!newRect) {
        const fallback = getSlotRect();
        if (fallback) applyRect(v, fallback);
        else { v.style.width = "0px"; v.style.height = "0px"; }
        transitioningRef.current = false;
        return;
      }

      applyRect(v, newRect);

      const a2 = v.animate(
        [
          { top: "0px", left: "0px", width: fsW + "px", height: fsH + "px" },
          { top: newRect.top + "px", left: newRect.left + "px", width: newRect.width + "px", height: newRect.height + "px" },
        ],
        { duration: SHRINK_MS, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      );

      await a2.finished;
      transitioningRef.current = false;
    };

    run().catch(() => {
      setCountdown(null);
      const v = videoRef.current;
      if (v) {
        const r = getSlotRect();
        if (r) applyRect(v, r);
        else { v.style.width = "0px"; v.style.height = "0px"; }
      }
      transitioningRef.current = false;
    });
  }, [phase, renderedPhase]);

  useEffect(() => {
    const onResize = () => {
      if (transitioningRef.current) return;
      const v = videoRef.current;
      const r = getSlotRect();
      if (v && r) applyRect(v, r);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { renderedPhaseRef.current = renderedPhase; }, [renderedPhase]);

  useEffect(() => {
    if (renderedPhase === "onflight") {
      samplesRef.current = [];
      setTotalDist(0);
      prevLatLonRef.current = null;
      prevFlightStateRef.current = null;
      setEventTimes({});
      setSnapshotMetT(null);
      setSnapshotTelemetry(null);
      setFlightSamples([]);
    }
  }, [renderedPhase]);

  useEffect(() => {
    if (renderedPhaseRef.current !== "onflight") return;
    samplesRef.current.push({
      altitude:     live.altitude,
      velocity:     live.velocity,
      acceleration: live.acceleration,
      temp:         live.temp,
      pressure:     live.pressure,
      lat:          live.lat,
      lon:          live.lon,
      metT:         live.metT,
    });
    if (live.gpsFix && prevLatLonRef.current) {
      const d = haversineKm(prevLatLonRef.current.lat, prevLatLonRef.current.lon, live.lat, live.lon);
      if (d < 50) setTotalDist((prev) => prev + d);
    }
    prevLatLonRef.current = { lat: live.lat, lon: live.lon };
  }, [live]);

  useEffect(() => {
    if (renderedPhase !== "onflight") setFlightAlerts([]);
  }, [renderedPhase]);

  // Acceleration-based launch detect: preflight → onflight
  useEffect(() => {
    if (phase !== "preflight") return;
    if (launchTriggeredRef.current) return;
    if (live.acceleration > 50) {
      launchTriggeredRef.current = true;
      setPhase("onflight");
    }
  }, [live.acceleration, phase]);

  // flightState transition → show alert banner
  useEffect(() => {
    if (renderedPhase !== "onflight") return;
    const fs = live.flightState;
    if (!fs || fs === prevFlightStateRef.current) return;
    prevFlightStateRef.current = fs;
    setEventTimes((prev) => ({ ...prev, [fs]: live.metT }));
    const alert = FLIGHT_STATE_ALERTS[fs];
    if (!alert) return;
    setFlightAlerts((prev) => prev.find((a) => a.id === alert.id) ? prev : [...prev, alert]);
    setTimeout(() => setFlightAlerts((prev) => prev.filter((a) => a.id !== alert.id)), 5000);
  }, [live.flightState, renderedPhase]);

  // Auto-transition onflight → postflight when simulation runs out of data
  useEffect(() => {
    if (!live.playbackComplete) return;
    if (renderedPhaseRef.current !== "onflight") return;
    const stats = computeFlightStats(samplesRef.current);
    setFlightStats(stats);
    setSnapshotMetT(live.metT);
    setSnapshotTelemetry({ ...live });
    setFlightSamples([...samplesRef.current]);
    samplesRef.current = [];
    setPhase("postflight");
    setRenderedPhase("postflight");
  }, [live.playbackComplete]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "y" || e.key === "Y") {
        setPhase((p) => (p === "preflight" ? "onflight" : p));
      }
      if (e.key === "c" || e.key === "C") {
        if (renderedPhaseRef.current === "onflight") {
          const current = liveRef.current;
          const stats = computeFlightStats(samplesRef.current);
          setFlightStats(stats);
          setSnapshotMetT(current.metT);
          setSnapshotTelemetry({ ...current });
          setFlightSamples([...samplesRef.current]);
          samplesRef.current = [];
          setPhase("postflight");
          setRenderedPhase("postflight");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const phaseLabel = PHASE_LABELS[renderedPhase] || "PRE-FLIGHT";

  return (
    <div id="shell">
      <TopBar phase={phaseLabel} />

      {renderedPhase === "preflight"  && (
        <PreFlight
          telemetry={telemetry}
          onActivate={() => setPreflightActive(true)}
        />
      )}
      {renderedPhase === "onflight"   && <OnFlight   telemetry={telemetry} />}
      {renderedPhase === "postflight" && <PostFlight telemetry={snapshotTelemetry ?? telemetry} flightStats={flightStats} finalMetT={snapshotMetT} eventTimes={eventTimes} flightSamples={flightSamples} />}

      <div ref={videoRef} className="video-persistent" style={renderedPhase === "postflight" ? { display: "none" } : undefined}>
        <RightData />
      </div>

      <IconBar telemetry={telemetry} preflightActive={preflightActive} />

      {countdown !== null && (
        <div className="countdown-overlay">
          <span className={`countdown-num${countdown === "BOOST" ? " boost" : ""}`}>
            {countdown}
          </span>
        </div>
      )}

      {flightAlerts.length > 0 && (
        <div className="of-hud-alerts">
          {flightAlerts.map((alert) => (
            <div key={alert.id} className={`of-hud-alert of-hud-alert--${alert.color}`}>
              <div className="of-hud-alert-label">{alert.label}</div>
              <div className="of-hud-alert-sub">{alert.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
