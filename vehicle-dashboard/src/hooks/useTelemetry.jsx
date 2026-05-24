import { useEffect, useRef, useState } from "react";

const NETUR = 0;
const DEFAULT_URL = "ws://localhost:9001"; //DF to change
const STALE_MS = 1500;

const INITIAL = {
  missionTimeMs: 0,
  metT: "00:00:00",

  altitude: 0,
  velocity: 0,
  acceleration: 0,

  vx: 0,
  vy: 0,
  vz: 0,
  ax: 0,
  ay: 0,
  az: 0,
  gx: 0,
  gy: 0,
  gz: 0,

  roll: 0,
  pitch: 0,
  yaw: 0,
  posX: 0,
  posY: 0,
  posZ: 0,

  lat: 0,
  lon: 0,
  heading: 0,

  flags: 0,
  gpsFix: false,
  armed: false,
  burning: false,

  stage: "1",
  burnPhase: "—",
  currentState: "—",
  burnStatus: "—",
  pointingMode: "—",
  groundStation: "GND",

  temp: 0,
  pressure: 0,

  totalDist: 0,
  peakAlt: 0,
  signalQuality: 0,
  totalPackets: 0,

  connections: [
    ["AIRBRAKE", "Connected"],
    ["MAIN", "Connected"],
    ["DROGUE", "Connected"],
    ["AIRTAGS", "Connected"],
  ],

  stages: [
    { id: 0, label: "LAUNCH", state: "unarmed" },
    { id: 1, label: "ลืม", state: "unarmed" },
    { id: 2, label: "APOGEE", state: "unarmed" },
    { id: 3, label: "DROGUE", state: "unarmed" },
    { id: 4, label: "MAIN", state: "unarmed" },
    { id: 5, label: "LANDED", state: "unarmed" },
  ],
};

export default function useTelemetry(url = DEFAULT_URL) {
  const [telemetry, setTelemetry] = useState(INITIAL);
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState(false);
  const lastRxRef = useRef(0);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let stopped = false;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          lastRxRef.current = Date.now();
          setLive(true);
          setTelemetry((prev) => ({ ...prev, ...data }));
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
