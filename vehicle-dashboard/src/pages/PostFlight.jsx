import { useEffect, useState } from "react";

export default function PostFlight({ telemetry = {} }) {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const local = {
    lat: 54.341579,
    lon: -1.43536,
    alt: 256000,
    vel: 25555,
    dist: 245,
    temp: -10,
    powerL: 0.62,
    powerR: 0.58,
    accel: 6,
    velRaw: 5,
    heading: 50,
    donut: 74,
    pressure: 1030,
    series: [4.2, 5.1, 6.0, 6.8, 6.4, 5.0, 4.6, 5.3, 6.1, 7.0, 6.7, 5.4, 4.3],
    tick: 0,
  };

  const merged = { ...local, ...telemetry };

  const elapsed = 55 * 3600 + 55 * 60 + 25;

  return (
    <div id="body" className={`postflight-body ${entering ? "entering" : ""}`}>
      <div className="pf-grid">
        <LaunchVehicle />
        <Trajectory telemetry={merged} />
        <MissionClock countdown={elapsed} telemetry={merged} />
        <SensorDetail telemetry={merged} />
        <SensorGraphs telemetry={merged} />
        <Groundstation telemetry={merged} />
      </div>

      <div className="pf-video">
        <div className="pf-video-head">
          <span className="pf-video-lbl">FEED</span>
          <span className="pf-video-tag">CAM-01</span>
        </div>
        <div className="video-slot" />
      </div>
    </div>
  );
}

function PfPanel({ title, children, className = "" }) {
  return (
    <div className={`pf-panel ${className}`}>
      <div className="pf-panel-head">
        <span className="pf-panel-title">{title}</span>
        <span className="pf-panel-bracket" />
      </div>
      <div className="pf-panel-body">{children}</div>
    </div>
  );
}

function LaunchVehicle() {
  return (
    <PfPanel title="LAUNCH VEHICLE" className="pf-lv">
      <div className="lv-stage">
        <div className="pf-placeholder">
          <div className="pf-placeholder-corner tl" />
          <div className="pf-placeholder-corner tr" />
          <div className="pf-placeholder-corner bl" />
          <div className="pf-placeholder-corner br" />
          <div>
            <div className="pf-placeholder-title">VEHICLE IMAGE</div>
            <div className="pf-placeholder-sub">placeholder</div>
          </div>
        </div>
        <div className="lv-chip">CURSR-V</div>
      </div>
      <div className="lv-title">TEAM-213</div>

      <div className="lv-time">DATE?TIME</div>
    </PfPanel>
  );
}

function Trajectory({ telemetry }) {
  return (
    <PfPanel title="FINAL TRAJECTORY / LANDING SITE" className="pf-traj">
      <div className="traj-map">
        <div className="pf-placeholder">
          <div className="pf-placeholder-corner tl" />
          <div className="pf-placeholder-corner tr" />
          <div className="pf-placeholder-corner bl" />
          <div className="pf-placeholder-corner br" />
          <div>
            <div className="pf-placeholder-title">MAP</div>
            <div className="pf-placeholder-sub">placeholder</div>
          </div>
        </div>
      </div>
      <div className="traj-stats">
        <div className="k">LAT</div>
        <div className="v">: {telemetry.lat.toFixed(6)}</div>
        <div className="k">LONG</div>
        <div className="v">: {telemetry.lon.toFixed(6)}</div>
        <div className="k">ALT</div>
        <div className="v">: {telemetry.alt.toLocaleString()} m</div>
        <div className="k">VEL</div>
        <div className="v">: {telemetry.vel.toLocaleString()} km/h</div>
      </div>
    </PfPanel>
  );
}

function MissionClock({ countdown, telemetry }) {
  const fmt = (n) => String(n).padStart(2, "0");
  const h = Math.floor(countdown / 3600);
  const m = Math.floor((countdown % 3600) / 60);
  const s = countdown % 60;
  return (
    <PfPanel title="MISSION CLOCK / SUMMARY" className="pf-mc">
      <div className="mc-countdown-label">TOTAL FLIGHT TIME</div>
      <div className="mc-countdown">
        {fmt(h)}:{fmt(m)}:{fmt(s)}
      </div>
      <div className="mc-grid">
        <div className="mc-cell">
          <div className="label">Total Distance</div>
          <div className="val">{telemetry.dist} KM</div>
        </div>
        <div className="mc-cell">
          <div className="label">Avg Speed</div>
          <div className="val">{telemetry.vel.toLocaleString()} KM/H</div>
        </div>
        <div className="mc-cell">
          <div className="label">Peak Altitude</div>
          <div className="val">{telemetry.alt.toLocaleString()} M</div>
        </div>
        <div className="mc-cell">
          <div className="label">Transmissions</div>
          <div className="val">128 TOTAL</div>
        </div>
      </div>
    </PfPanel>
  );
}

function SensorDetail({ telemetry }) {
  /* Original live sensor detail (temperature gauge, power meters, inertia/magneto)
     commented out for post-flight — replaced with a placeholder slot for a
     MATLAB-exported graph.

  const temp = telemetry.temp;
  const min = -20, max = 30;
  const pct = (temp - min) / (max - min);
  const angle = -110 + pct * 220;
  const cx = 100, cy = 110, r = 75;
  const polar = (deg, rad = r) => {
    const a = (deg - 90) * (Math.PI / 180);
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  };
  const arcPath = (a1, a2, rad = r) => {
    const p1 = polar(a1, rad), p2 = polar(a2, rad);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${rad} ${rad} 0 ${large} 1 ${p2.x} ${p2.y}`;
  };
  const tickVals = [...];
  ...full gauge SVG, PowerMeter rows, and INERTIA/MAGNETO block...
  */

  return (
    <PfPanel title="SENSOR DETAIL" className="pf-sd">
      <div className="sd-matlab-slot">
        <div className="pf-placeholder">
          <div className="pf-placeholder-corner tl" />
          <div className="pf-placeholder-corner tr" />
          <div className="pf-placeholder-corner bl" />
          <div className="pf-placeholder-corner br" />
          <div>
            <div className="pf-placeholder-title">MATLAB GRAPH</div>
            <div className="pf-placeholder-sub">placeholder</div>
          </div>
        </div>
      </div>
    </PfPanel>
  );
}

function PowerMeter({ label, value }) {
  const lit = Math.round(value * 24);
  const colorFor = (i) => {
    if (i >= lit) return "#2a1f3a";
    if (i < 15) return "var(--green)";
    if (i < 20) return "var(--gold2)";
    return "var(--crim2)";
  };
  return (
    <div className="sd-meter-row">
      <span className="lbl">{label}</span>
      <div className="sd-meter">
        <div className="sd-meter-bar">
          {Array.from({ length: 24 }).map((_, i) => (
            <i key={i} style={{ background: colorFor(i) }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SensorGraphs({ telemetry }) {
  return (
    <PfPanel title="SOME GRAPHS" className="pf-sg">
      <div className="sg-line">
        <div className="pf-placeholder">
          <div className="pf-placeholder-corner tl" />
          <div className="pf-placeholder-corner tr" />
          <div className="pf-placeholder-corner bl" />
          <div className="pf-placeholder-corner br" />
          <div>
            <div className="pf-placeholder-title">SOME GRAPH</div>
            <div className="pf-placeholder-sub">placeholder</div>
          </div>
        </div>
      </div>
      <div className="sg-bottom">
        <DonutGauge value={telemetry.donut} />
        <HalfGauge value={telemetry.pressure} />
      </div>
    </PfPanel>
  );
}

// remove TS soon
function DonutGauge({ value }) {
  const r = 46,
    cx = 70,
    cy = 70;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="sg-donut">
      <svg width="130" height="130" viewBox="0 0 140 140">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#2a1f3a"
          strokeWidth="8"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--crim2)"
          strokeWidth="8"
          strokeDasharray={`${dash} ${c}`}
          strokeDashoffset={c / 4}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--bright)"
          fontSize="26"
          fontFamily="Rajdhani"
          fontWeight="700"
        >
          {Math.round(value)}
          <tspan fontSize="14" fill="#9888a8">
            %
          </tspan>
        </text>
      </svg>
    </div>
  );
}

function HalfGauge({ value }) {
  const min = 900,
    max = 1050;
  const pct = (value - min) / (max - min);
  const r = 50,
    cx = 70,
    cy = 70;
  const polar = (deg) => {
    const a = (deg - 180) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const start = polar(0);
  const end = polar(180);
  const cur = polar(pct * 180);
  const bg = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  const fg = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${cur.x} ${cur.y}`;
  return (
    <div className="sg-donut">
      <svg width="150" height="95" viewBox="0 0 140 90">
        <path
          d={bg}
          fill="none"
          stroke="#2a1f3a"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={fg}
          fill="none"
          stroke="var(--green)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="var(--bright)"
          fontSize="22"
          fontWeight="700"
          fontFamily="Rajdhani"
        >
          {Math.round(value)}
        </text>
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#9888a8"
          fontSize="11"
        >
          xxx
        </text>
        <text
          x={start.x - 4}
          y={start.y + 12}
          fontSize="9"
          fill="#6a5d7c"
          textAnchor="end"
          fontFamily="Share Tech Mono"
        >
          900
        </text>
        <text
          x={end.x + 4}
          y={end.y + 12}
          fontSize="9"
          fill="#6a5d7c"
          fontFamily="Share Tech Mono"
        >
          1050
        </text>
      </svg>
    </div>
  );
}

function Groundstation() {
  return (
    <PfPanel title="GROUNDSTATION" className="pf-gs">
      <div className="gs-top">
        <div className="gs-info">
          <div className="lbl">STATION</div>
          <div className="val">GPS MAYBE</div>
          <div className="lbl">LAT / LONG</div>
          <div className="val">xxxx / xxxx</div>
          <div className="lbl">LAST CONTACT</div>
          <div className="val">via onmessage</div>
        </div>
      </div>

      <div className="gs-stats-grid">
        <div className="gs-stat">
          <div className="lbl">xxxxx</div>
          <div className="val">xxx</div>
        </div>
        <div className="gs-stat">
          <div className="lbl">xxxx</div>
          <div className="val">xxx</div>
        </div>
        <div className="gs-stat">
          <div className="lbl">xxx</div>
          <div className="val">xxx</div>
        </div>
        <div className="gs-stat">
          <div className="lbl">x</div>
          <div className="val">xxx </div>
        </div>
      </div>

      <div className="gs-bar-row">
        <span className="lbl">something</span>
        <div className="gs-bar">
          <i style={{ width: "94.2%" }} />
        </div>
        <span className="pct">94.2%</span>
      </div>
      <div className="gs-bar-row">
        <span className="lbl">something</span>
        <div className="gs-bar">
          <i style={{ width: "98.7%" }} />
        </div>
        <span className="pct">98.7%</span>
      </div>
    </PfPanel>
  );
}
