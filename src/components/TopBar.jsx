import { useEffect, useState } from "react";
import "./TopBar.css";

export default function TopBar({
  phase = "PRE-FLIGHT",
  missionStatus = "[PHD FOR SPONSORS AND LOGOS]",
  team = "CHULALONGKORN UNIVERSITY",
  number = "TEAM-213",
}) {
  const [utc, setUtc] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const t = [n.getUTCHours(), n.getUTCMinutes(), n.getUTCSeconds()]
        .map((v) => String(v).padStart(2, "0"))
        .join(":");
      setUtc(t);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="topbar">
      {/* Layer 1 — Org name */}
      <div className="topbar-layer1">
        <div className="topbar-org-left">
          <span className="topbar-org-tag">PHD</span>
          <span className="topbar-org-sep">|</span>
          <span className="topbar-org-sub">PHD</span>
        </div>
        <div className="topbar-org-center">
          <span className="topbar-title">PHD</span>
        </div>
        <div className="topbar-org-right">
          <span className="topbar-date" id="utc-date">
            {new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}
          </span>
        </div>
      </div>

      {/* Layer 2 — Split HUD */}
      <div className="topbar-layer2">
        {/* Left red side */}
        <div className="topbar-left">
          <div className="topbar-item">
            <span className="topbar-lbl">TEAM</span>
            <span className="topbar-val accent">{team}</span>
          </div>
          <div className="topbar-vdivider" />
          <div className="topbar-item">
            <span className="topbar-lbl">NUMBER</span>
            <span className="topbar-val">{number}</span>
          </div>
          <div className="topbar-vdivider" />
          <div className="topbar-item">
            <span className="topbar-lbl"></span>
            <span className="topbar-val dim"></span>
          </div>
        </div>

        {/* Center block */}
        <div className="topbar-center">
          <div className="topbar-center-inner">
            <span className="topbar-phase-lbl">MISSION PHASE</span>
            <span className="topbar-phase-val">{phase}</span>
          </div>
        </div>

        {/* Right dark side */}
        <div className="topbar-right">
          <div className="topbar-item end">
            <span className="topbar-lbl">LOGO</span>
            <span
              className={`topbar-val ${missionStatus === "NOMINAL" ? "green" : "red"}`}
            >
              {missionStatus}
            </span>
          </div>
          <div className="topbar-vdivider" />
          <div className="topbar-item end">
            <span className="topbar-lbl">UTC</span>
            <span className="topbar-val mono">{utc}</span>
          </div>
          <div className="topbar-vdivider" />
          <div className="topbar-status-dot" />
        </div>
      </div>
    </div>
  );
}
