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

  return (
    <div id="body" className={entering ? "entering" : ""}>
      <LeftList />
      <LeftData telemetry={telemetry} />
      <div id="model-with-overlay">
        <ModelZone />
        <div className="bubble-overlay">
          <div className="bubble bubble-tl">
            <div className="bubble-title">PHD</div>
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
          </div>
          <div className="bubble bubble-tr">
            <div className="bubble-title">PHD</div>
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
          </div>
          <div className="bubble bubble-l">
            <div className="bubble-title">PHD</div>
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
          </div>
          <div className="bubble bubble-r">
            <div className="bubble-title">PHD</div>
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
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
