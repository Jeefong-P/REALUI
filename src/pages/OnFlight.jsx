import { useEffect, useState } from "react";
import ArcGauge from "../components/at_and_speedom";
import CoordAxes from "../components/CoordAxes";
import MissionTimeline from "../components/MissionTimeline";

export default function OnFlight({ telemetry = {} }) {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const {
    metT = "00:00:00",
    stage = "1",
    burnPhase = "Ascent",
    altitude = "—",
    velocity = "—",
    acceleration = "—",
    posX = 0,
    posY = 0,
    posZ = 0,
    systemStatus = "NOMINAL",
  } = telemetry;

  return (
    <div id="body" className={`onflight-body ${entering ? "entering" : ""}`}>
      {/* LEFT — mission timeline */}
      <div className="of-side of-side-left">
        <Stat label="T+ MET" value={metT} mono />
        <Divider />
        <Stat label="Stage" value={stage} accent />
        <Divider />
        <Stat label="Burn Phase" value={burnPhase} />
        <Divider />
        <Stat label="Status" value={systemStatus} className="green" />
        <Divider />
        <MissionTimeline />
      </div>

      {/* CENTER — live video slot (real video lives in App.jsx) */}
      <div className="of-video-zone">
        <div className="video-slot" />
      </div>

      {/* RIGHT — flight metrics */}
      <div className="of-side of-side-right">
        <Stat label="Altitude" value={altitude} unit="km" mono />
        <Divider />
        <div className="of-gauge">
          <ArcGauge value={velocity} max={1000} title="VELOCITY" unit="m/s" size={150} />
        </div>
        <div className="of-gauge">
          <ArcGauge value={acceleration} max={10} title="ACCEL" unit="G" size={150} />
        </div>
        <Divider />
        <CoordAxes rx={posX} ry={posY} rz={posZ} />
      </div>
    </div>
  );
}

function Stat({ label, value, unit, mono, accent, className = "" }) {
  return (
    <div className={`of-stat ${className}`}>
      <span className="of-lbl">{label}</span>
      <span className={`of-val ${mono ? "mono" : ""} ${accent ? "accent" : ""}`}>
        {value}
        {unit && <span className="of-unit"> {unit}</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="of-divider" />;
}
