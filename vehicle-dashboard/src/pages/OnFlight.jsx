import { useEffect, useState } from "react";
import ArcGauge from "../components/at_and_speedom";
import MissionTimeline from "../components/MissionTimeline";

export default function OnFlight({ telemetry = {} }) {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const {
    metT = "00:00:00",
    stage = "—",
    burnPhase = "—",
    altitude = 0,
    velocity = 0,
    acceleration = 0,
    systemStatus = "x",
    stages = [],
  } = telemetry;

  const altDisplay = Number.isFinite(altitude) ? altitude.toFixed(1) : "—";

  return (
    <div id="body" className={`onflight-body ${entering ? "entering" : ""}`}>
      {/* LEFT — mission timeline */}
      <div className="of-side of-side-left">
        <Stat label="T+ NET" value={metT} mono />
        <Divider />
        <Stat label="Stage" value={stage} accent />
        <Divider />
        <Stat label="Phase" value={burnPhase} />
        <Divider />
        <Stat label="thinking" value={systemStatus} className="green" />
        <Divider />
        <MissionTimeline stages={stages} />
      </div>

      {/* CENTER — live video slot (real video lives in App.jsx) */}
      <div className="of-video-zone">
        <div className="video-slot" />
      </div>

      {/* RIGHT — flight metrics */}
      <div className="of-side of-side-right">
        <Stat label="Altitude" value={altDisplay} unit="m" mono />
        <Divider />
        <div className="of-gauge">
          <ArcGauge
            value={velocity}
            max={1000}
            title="VELOCITY"
            unit="m/s"
            size={150}
          />
        </div>
        <div className="of-gauge">
          <ArcGauge
            value={acceleration}
            max={10}
            title="ACCEL"
            unit="G"
            size={150}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, mono, accent, className = "" }) {
  return (
    <div className={`of-stat ${className}`}>
      <span className="of-lbl">{label}</span>
      <span
        className={`of-val ${mono ? "mono" : ""} ${accent ? "accent" : ""}`}
      >
        {value}
        {unit && <span className="of-unit"> {unit}</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="of-divider" />;
}
