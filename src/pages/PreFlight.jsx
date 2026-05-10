import { useEffect, useState } from "react";
import LeftList from "../components/LeftList";
import LeftData from "../components/LeftData";
import ModelZone from "../components/ModelZone";
import RightList from "../components/RightList";

export default function PreFlight({ telemetry = {} }) {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const {
    ppo2 = 2.68,
    cabinTemp = 2.4,
    cabinPressure = 14.01,
    co2 = 0.16,
    loopA = 26.53,
    loopB = 20.01,
  } = telemetry;

  return (
    <div id="body" className={entering ? "entering" : ""}>
      <LeftList />
      <LeftData telemetry={telemetry} />
      <div id="model-with-overlay">
        <ModelZone />
        <div className="bubble-overlay">
          <div className="bubble bubble-tl">
            <div className="bubble-title">ATMOSPHERIC</div>
            <BRow label="PPO2" value={ppo2} unit="psia" />
            <BRow label="CO2" value={co2} unit="mmHg" />
          </div>
          <div className="bubble bubble-tr">
            <div className="bubble-title">CABIN</div>
            <BRow label="Temp" value={cabinTemp} unit="°C" />
            <BRow label="Pressure" value={cabinPressure} unit="psia" />
          </div>
          <div className="bubble bubble-l">
            <div className="bubble-title">THERMAL</div>
            <BRow label="Loop A" value={loopA} unit="°C" />
            <BRow label="Loop B" value={loopB} unit="°C" />
          </div>
          <div className="bubble bubble-r">
            <div className="bubble-title">RECOVERY</div>
            <BRow label="Drogue" value="ARMED" />
            <BRow label="Main" value="ARMED" />
            <BRow label="Alt Trigger" value="457 m" />
          </div>
        </div>
      </div>
      <div id="right-column">
        <div className="video-slot" />
        <RightList />
      </div>
    </div>
  );
}

function BRow({ label, value, unit }) {
  return (
    <div className="b-row">
      <span className="b-lbl">{label}</span>
      <span className="b-val">
        {value}
        {unit && <span className="b-unit"> {unit}</span>}
      </span>
    </div>
  );
}
