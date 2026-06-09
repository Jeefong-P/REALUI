import { useEffect, useState } from "react";
import Clock from "./Clock";

const s = { stroke: "currentColor", fill: "none" };
const f = { fill: "currentColor" };

const IcoTelemetry = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <rect x="3"    y="13" width="2.5" height="8"  rx="1" {...f} />
    <rect x="7.5"  y="9"  width="2.5" height="12" rx="1" {...f} />
    <rect x="12"   y="5"  width="2.5" height="16" rx="1" {...f} />
    <rect x="16.5" y="8"  width="2.5" height="13" rx="1" {...f} />
  </svg>
);
const IcoLive = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <rect x="2" y="7" width="14" height="10" rx="2" strokeWidth="1.5" {...s} />
    <path d="M16 10.5l6-2.5v8l-6-2.5v-3z" strokeWidth="1.5" {...s} />
  </svg>
);
const IcoGPS = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path d="M12 2a6 6 0 00-6 6c0 4.5 6 14 6 14s6-9.5 6-14a6 6 0 00-6-6z" strokeWidth="1.5" {...s} />
    <circle cx="12" cy="8" r="2" strokeWidth="1.5" {...s} />
  </svg>
);
const IcoComms = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path d="M12 22v-8" strokeWidth="1.5" strokeLinecap="round" {...s} />
    <path d="M7.5 8.5a6.5 6.5 0 019 0"  strokeWidth="1.5" strokeLinecap="round" {...s} />
    <path d="M4.5 5.5a10.5 10.5 0 0115 0" strokeWidth="1.5" strokeLinecap="round" {...s} />
    <circle cx="12" cy="14" r="1.5" {...f} />
  </svg>
);
const IcoDataLog = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <ellipse cx="12" cy="6"  rx="8" ry="3"   strokeWidth="1.5" {...s} />
    <path d="M4 6v5c0 1.66 3.58 3 8 3s8-1.34 8-3V6" strokeWidth="1.5" {...s} />
    <path d="M4 11v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" strokeWidth="1.5" {...s} />
  </svg>
);
const IcoThermal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path d="M12 3v9.27" strokeWidth="1.5" strokeLinecap="round" {...s} />
    <path d="M9 7h6"     strokeWidth="1.5" strokeLinecap="round" {...s} />
    <circle cx="12" cy="17" r="4" strokeWidth="1.5" {...s} />
    <circle cx="12" cy="17" r="1.5" {...f} />
  </svg>
);
const IcoAttitude = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" {...s} />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeWidth="1.4" strokeLinecap="round" {...s} />
    <path d="M8 13.5l4-4 4 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...s} />
  </svg>
);
const IcoOrbit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="2.5" {...f} />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" strokeWidth="1.4" {...s} />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" strokeWidth="1.4" transform="rotate(60 12 12)" {...s} />
  </svg>
);

const ICONS = [
  { key: "telemetry", label: "Telemetry", Ico: IcoTelemetry, selectable: true },
  { key: "live",      label: "Live Feed",  Ico: IcoLive,      selectable: true },
  { key: "gps",       label: "GPS",        Ico: IcoGPS,       selectable: true },
  { key: "comms",     label: "Comms",      Ico: IcoComms,     selectable: true },
  { key: "datalog",   label: "Data Log",   Ico: IcoDataLog,   selectable: false },
  { key: "thermal",   label: "Thermal",    Ico: IcoThermal,   selectable: false },
  { key: "attitude",  label: "Attitude",   Ico: IcoAttitude,  selectable: false },
  { key: "orbit",     label: "Orbit",      Ico: IcoOrbit,     selectable: false },
];

export default function IconBar({ telemetry = {}, preflightActive = false }) {
  const {
    currentState   = "Far Field Pointing Deorbit",
    burnStatus     = "Burn Enabled",
    pointingMode   = "Sun + GEO",
    gpsStatus      = "GPS ▲",
    velocityFooter = "22.3K / 6600",
    groundStation  = "GND TBE",
  } = telemetry;

  const [selected, setSelected] = useState(new Set());

  // When preflight activates, force all icons green
  useEffect(() => {
    if (preflightActive) {
      setSelected(new Set(ICONS.map((i) => i.key)));
    }
  }, [preflightActive]);

  const toggle = (key, selectable) => {
    if (!selectable) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div id="iconbar">
      <div className="ib-segs">
        <Seg label="State"    value={currentState} />
        <div className="ib-vdiv" />
        <Seg label="Burn"     value={burnStatus} hi />
        <div className="ib-vdiv" />
        <Seg label="Pointing" value={pointingMode} />
      </div>

      <div className="ib-vdiv" />

      <div className="icon-btns">
        {ICONS.map(({ key, label, Ico, selectable }) => {
          const active = selected.has(key);
          return (
            <div
              key={key}
              className={`ib${active ? " ib-active" : ""}${selectable ? " ib-selectable" : ""}`}
              onClick={() => toggle(key, selectable)}
              title={selectable ? (active ? "Deselect" : "Select") : undefined}
            >
              <Ico />
              <div className="ib-lbl">{label}</div>
            </div>
          );
        })}
      </div>

      <div className="ib-vdiv" />

      <div className="ib-quick">
        <span className="ib-quick-val green">{gpsStatus}</span>
        <span className="ib-quick-val">{velocityFooter}</span>
        <span className="ib-quick-val dim">{groundStation}</span>
        <span className="ib-quick-val clock"><Clock /></span>
      </div>
    </div>
  );
}

function Seg({ label, value, hi }) {
  return (
    <div className="ib-seg">
      <span className="ib-seg-lbl">{label}</span>
      <span className={`ib-seg-val${hi ? " hi" : ""}`}>{value}</span>
    </div>
  );
}
