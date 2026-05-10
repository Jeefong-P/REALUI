import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import IconBar from "./components/IconBar";
import RightData from "./components/RightData";
import PreFlight from "./pages/PreFlight";
import OnFlight from "./pages/OnFlight";

const STATIC_TELEMETRY = {
  ppo2: 2.68,
  cabinTemp: 2.4,
  cabinPressure: 14.01,
  co2: 0.16,
  loopA: 26.53,
  loopB: 20.01,

  netPwr1: 0,
  netPwr2: 0,

  metT: "00:00:00",
  stage: "1",
  burnPhase: "Ascent",
  altitude: "—",
  velocity: "—",
  acceleration: "—",
  posX: "—",
  posY: "—",
  posZ: "—",
  fuelPct: 72,
  oxPct: 60,
  systemStatus: "NOMINAL",

  currentState: "None",
  burnStatus: "None",
  pointingMode: "None",
  gpsStatus: "GPS ▲",
  velocityFooter: "None",
  groundStation: "GND",
};

// TS_in_out
const ZOOM_OUT_MS = 700;
const HOLD_MS = 600;
const SHRINK_MS = 1300;

function getSlotRect() {
  const slot = document.querySelector(".video-slot");
  return slot ? slot.getBoundingClientRect() : null;
}

function applyRect(el, r) {
  el.style.top = r.top + "px";
  el.style.left = r.left + "px";
  el.style.width = r.width + "px";
  el.style.height = r.height + "px";
}

function nextFrame() {
  return new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function App() {
  const [phase, setPhase] = useState("preflight"); // target page
  const [renderedPhase, setRenderedPhase] = useState("preflight"); // currently mounted page

  const videoRef = useRef(null);
  const isFirstRenderRef = useRef(true);
  const transitioningRef = useRef(false);

  const telemetry = STATIC_TELEMETRY;

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

    transitioningRef.current = true;

    const fsW = window.innerWidth;
    const fsH = window.innerHeight;

    const oldRect = v.getBoundingClientRect();

    v.style.top = "0px";
    v.style.left = "0px";
    v.style.width = fsW + "px";
    v.style.height = fsH + "px";

    const a1 = v.animate(
      [
        {
          top: oldRect.top + "px",
          left: oldRect.left + "px",
          width: oldRect.width + "px",
          height: oldRect.height + "px",
        },
        { top: "0px", left: "0px", width: fsW + "px", height: fsH + "px" },
      ],
      { duration: ZOOM_OUT_MS, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    );

    a1.finished
      .then(() => wait(HOLD_MS))
      .then(() => {
        // Page swap
        setRenderedPhase(phase);
        return nextFrame();
      })
      .then(() => {
        const newRect = getSlotRect();
        if (!newRect) {
          transitioningRef.current = false;
          return;
        }

        applyRect(v, newRect);

        const a2 = v.animate(
          [
            { top: "0px", left: "0px", width: fsW + "px", height: fsH + "px" },
            {
              top: newRect.top + "px",
              left: newRect.left + "px",
              width: newRect.width + "px",
              height: newRect.height + "px",
            },
          ],
          { duration: SHRINK_MS, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
        );
        return a2.finished;
      })
      .then(() => {
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

  useEffect(() => {
    // const channel = new BroadcastChannel("mission_control");
    // channel.onmessage = (e) => {
    //   if (e.data.type === "TELEMETRY_START") setPhase("onflight");
    // };
    // return () => channel.close();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "l" || e.key === "L") {
        setPhase((p) => (p === "preflight" ? "onflight" : "preflight"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const phaseLabel = renderedPhase === "preflight" ? "PRE-FLIGHT" : "ON-FLIGHT";

  return (
    <div id="shell">
      <TopBar phase={phaseLabel} />

      {renderedPhase === "preflight" ? (
        <PreFlight telemetry={telemetry} />
      ) : (
        <OnFlight telemetry={telemetry} />
      )}

      <div ref={videoRef} className="video-persistent">
        <RightData />
      </div>

      <IconBar telemetry={telemetry} />
    </div>
  );
}
