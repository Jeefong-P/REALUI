import { useEffect, useState } from "react";
import "./TopBar.css";

export default function TopBar({
  phase = "PRE-FLIGHT",
  missionStatus = "NOMINAL",
  team = "CURSR-07",
  station = "GS-01",
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
      <div className="topbar-layer1">
        <div className="topbar-org-left">
          <span className="topbar-org-tag">CHULA ENGINEERING</span>
          <span className="topbar-org-sep">|</span>
          <span className="topbar-org-sub">FOUNDATION TOWARD INNOVATION</span>
        </div>
        <div className="topbar-org-center">
          <span className="topbar-title">VEHICLE OVERVIEW</span>
        </div>
        <div className="topbar-org-right">
          <span className="topbar-date" id="utc-date">
            {new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}
          </span>
        </div>
      </div>

      <div className="topbar-layer2">
        <div className="topbar-left">
          <div className="topbar-item">
            <span className="topbar-lbl">TEAM</span>
            <span className="topbar-val accent">{team}</span>
          </div>
          <div className="topbar-vdivider" />
          <div className="topbar-item">
            <span className="topbar-lbl">STATION</span>
            <span className="topbar-val">{station}</span>
          </div>
          <div className="topbar-vdivider" />
          <div className="topbar-item">
            <span className="topbar-lbl">ROLE</span>
            <span className="topbar-val dim">FLIGHT SYS</span>
          </div>
        </div>

        {/*C*/}
        <div className="topbar-center">
          <div className="topbar-center-inner">
            <span className="topbar-phase-lbl">MISSION PHASE</span>
            <span className="topbar-phase-val">{phase}</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-item end">
            <span className="topbar-lbl">STATUS</span>
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
