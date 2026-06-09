import { useEffect, useRef, useState } from "react";

const DEFAULT_URL = "ws://localhost:9001";
const STALE_MS = 1500;

// Only fields the real hardware actually sends
const REAL_FIELDS = new Set([
  "lat",
  "lon",
  "heading",
  "gpsFix",
  "altitude",
  "velocity",
  "acceleration",
  "temp",
  "pressure",
  "ax",
  "ay",
  "az",
  "gx",
  "gy",
  "gz",
  "rx",
  "ry",
  "rz",
  "roll",
  "pitch",
  "yaw",
  "metT",
  "flightState",
  "playbackComplete",
]);

const INITIAL = {
  // Real sensor data
  lat: 0,
  lon: 0,
  heading: 0,
  gpsFix: false,
  altitude: 0,
  velocity: 0,
  acceleration: 0,
  temp: 0,
  pressure: 1013,
  ax: 0,
  ay: 0,
  az: 0,
  gx: 0,
  gy: 0,
  gz: 0,
  rx: 0,
  ry: 0,
  rz: 0,

  // Display/status fields — manually managed, not from hardware
  flightState: "IDLE",
  playbackComplete: false,
  missionTimeMs: 0,
  metT: "00:00:00",
  stage: "1",
  burnPhase: "—",
  currentState: "—",
  burnStatus: "—",
  pointingMode: "—",
  groundStation: "GND",
  armed: false,
  burning: false,
  totalDist: 0,
  peakAlt: 0,
  signalQuality: 0,
  totalPackets: 0,
  connections: [
    ["AIRBRAKE", "—"],
    ["MAIN", "—"],
    ["DROGUE", "—"],
    ["AIRTAGS", "—"],
  ],
  stages: [
    { id: 0, label: "LAUNCH", state: "unarmed" },
    { id: 1, label: "BURNOUT", state: "unarmed" },
    { id: 2, label: "APOGEE", state: "unarmed" },
    { id: 3, label: "DROGUE", state: "unarmed" },
    { id: 4, label: "MAIN CHUTE", state: "unarmed" },
    { id: 5, label: "LANDED", state: "unarmed" },
  ],
};

export default function useTelemetry(url = DEFAULT_URL) {
  const [telemetry, setTelemetry] = useState(INITIAL);
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState(false);
  const lastRxRef = useRef(0);
  const totalPacketsRef = useRef(0);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let stopped = false;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          // Only accept real sensor fields — ignore anything else
          const data = {};
          for (const key of REAL_FIELDS) {
            if (key in raw) data[key] = raw[key];
          }
          if (Object.keys(data).length === 0) return;
          lastRxRef.current = Date.now();
          totalPacketsRef.current += 1;
          setLive(true);
          setTelemetry((prev) => ({
            ...prev,
            ...data,
            totalPackets: totalPacketsRef.current,
          }));
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setLive(false);
        if (!stopped) reconnectTimer = setTimeout(connect, 1000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    const staleCheck = setInterval(() => {
      if (Date.now() - lastRxRef.current > STALE_MS) setLive(false);
    }, 500);

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      clearInterval(staleCheck);
      if (ws) ws.close();
    };
  }, [url]);

  return { telemetry, connected, live };
}
