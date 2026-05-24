import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import IconBar from "./components/IconBar";
import RightData from "./components/RightData";
import PreFlight from "./pages/PreFlight";
import OnFlight from "./pages/OnFlight";
import PostFlight from "./pages/PostFlight";
import useTelemetry from "./hooks/useTelemetry";

const PHASES = ["preflight", "onflight", "postflight"];
const PHASE_LABELS = {
  preflight: "PRE-FLIGHT",
  onflight: "ON-FLIGHT",
  postflight: "POST-FLIGHT",
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
  const [phase, setPhase] = useState("preflight");
  const [renderedPhase, setRenderedPhase] = useState("preflight");

  const videoRef = useRef(null);
  const isFirstRenderRef = useRef(true);
  const transitioningRef = useRef(false);

  const { telemetry: live, connected, live: streaming } = useTelemetry();
  const telemetry = {
    ...live,
    systemStatus: streaming ? "NOMINAL" : connected ? "WAITING" : "NO",
    gpsStatus: live.gpsFix ? "GPS ▲" : "GPS ▽",
    velocityFooter: `${Math.round(live.velocity)} m/s`,
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

      await a1.finished;
      await wait(HOLD_MS);

      setRenderedPhase(phase);

      // Retry until React commits the new page's DOM (up to ~10 frames)
      let newRect = null;
      for (let i = 0; i < 10; i++) {
        await nextFrame();
        newRect = getSlotRect();
        if (newRect) break;
      }

      if (!newRect) {
        // Couldn't find slot — snap back to avoid covering screen with black
        const fallback = getSlotRect();
        if (fallback) {
          applyRect(v, fallback);
        } else {
          v.style.width = "0px";
          v.style.height = "0px";
        }
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

      await a2.finished;
      transitioningRef.current = false;
    };

    run().catch(() => {
      // Ensure the div never permanently covers the screen on error
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

  useEffect(() => {
    // const channel = new BroadcastChannel("mission_control");
    // channel.onmessage = (e) => {
    //   if (e.data.type === "TELEMETRY_START") setPhase("onflight");
    // };
    // return () => channel.close();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "y" || e.key === "Y") {
        setPhase((p) => {
          const i = PHASES.indexOf(p);
          return PHASES[(i + 1) % PHASES.length];
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const phaseLabel = PHASE_LABELS[renderedPhase] || "PRE-FLIGHT";

  return (
    <div id="shell">
      <TopBar phase={phaseLabel} />

      {renderedPhase === "preflight" && <PreFlight telemetry={telemetry} />}
      {renderedPhase === "onflight" && <OnFlight telemetry={telemetry} />}
      {renderedPhase === "postflight" && <PostFlight telemetry={telemetry} />}

      <div ref={videoRef} className="video-persistent">
        <RightData />
      </div>

      <IconBar telemetry={telemetry} />
    </div>
  );
}
