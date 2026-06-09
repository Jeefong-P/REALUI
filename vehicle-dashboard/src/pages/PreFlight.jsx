import { useEffect, useState } from "react";
import LeftList from "../components/LeftList";
import LeftData from "../components/LeftData";
import ModelZone from "../components/ModelZone";
import RightList from "../components/RightList";

export default function PreFlight({ telemetry = {}, onActivate }) {
  const [entering, setEntering] = useState(true);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "x" || e.key === "X") && !activated) handleActivate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activated]);

  const handleActivate = () => {
    if (activated) return;
    setActivated(true);
    onActivate?.();
  };

  return (
    <div id="body" className={entering ? "entering" : ""}>
      <LeftList activated={activated} />

      <div id="left-data">
        <LeftData telemetry={telemetry} />
      </div>

      <div id="model-with-overlay">
        <ModelZone />
        <div className="bubble-overlay">
          <div className="bubble bubble-tl">
            <div className="bubble-title">OVERVIEW</div>
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
          </div>
          <div className="bubble bubble-tr">
            <div className="bubble-title">AVIBAY</div>
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
          </div>
          <div className="bubble bubble-l">
            <div className="bubble-title">PAYLOAD</div>
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
            <BRow label="PHD" value="PHD" />
          </div>
          <div className="bubble bubble-r">
            <div className="bubble-title">FIN</div>
            <BRow label="PHD" value="PHD" />
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
