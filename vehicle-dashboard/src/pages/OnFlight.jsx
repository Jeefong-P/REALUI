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
    altitude = "100",
    velocity = "100",
    acceleration = "100",
    pressure = "1013",
    temp = "22",
    rx,
    ry,
    rz,
    stages,
    systemStatus = "NOMINAL",
  } = telemetry;

  const tempPct = Math.min(100, Math.max(0, (Number(temp) / 120) * 100)).toFixed(1);

  const attitudeRx = Number.isFinite(rx) ? rx : 0;
  const attitudeRy = Number.isFinite(ry) ? ry : 0;
  const attitudeRz = Number.isFinite(rz) ? rz : 0;

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
        <MissionTimeline stages={stages} />
      </div>

      {/* CENTER — live video slot (real video lives in App.jsx) */}
      <div className="of-video-zone">
        <div className="video-slot" />
      </div>

      {/* RIGHT — flight metrics */}
      <div className="of-side of-side-right">
        <Stat label="Altitude" value={altitude} unit="m" mono />
        <Divider />
        <Stat label="Pressure" value={pressure} unit="hPa" mono />
        <Divider />
        <div className="of-gauge">
          <ArcGauge value={velocity} max={1000} title="VELOCITY" unit="m/s" size={115} />
        </div>
        <div className="of-gauge">
          <ArcGauge value={acceleration} max={200} title="ACCEL" unit="m/s²" size={115} />
        </div>
        <div className="gs-bar-row of-temp-row">
          <span className="lbl">TEMP</span>
          <div className="gs-bar of-temp-bar">
            <i style={{ width: `${tempPct}%` }} />
          </div>
          <span className="pct">{temp}°C</span>
        </div>
        <Divider />
        <CoordAxes rx={attitudeRx} ry={attitudeRy} rz={attitudeRz} />
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
