import { useEffect, useState } from "react";
import {
  AltitudeGraph,
  VelocityGraph,
  AccelerationGraph,
  TempPressureGraph,
} from "../components/FlightGraphs";

export default function PostFlight({
  telemetry = {},
  flightStats = null,
  finalMetT = null,
  eventTimes = {},
  flightSamples = [],
}) {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const local = {
    lat: 54.341579,
    lon: -1.43536,
    altitude: 256000,
    velocity: 25555,
    pressure: 1013,
    temp: 22,
    heading: 50,
  };

  const merged = { ...local, ...telemetry };

  return (
    <div id="body" className={`postflight-body ${entering ? "entering" : ""}`}>
      <div className="pf-grid">
        <MissionClock
          telemetry={merged}
          stages={merged.stages}
          finalMetT={finalMetT}
          eventTimes={eventTimes}
        />
        <FlightSummary flightStats={flightStats} />
        <SensorDetail samples={flightSamples} />
        <SensorGraphs telemetry={merged} flightStats={flightStats} />
        <Trajectory telemetry={merged} />
        <GraphTriple samples={flightSamples} />
      </div>
    </div>
  );
}

// ── Shared panel wrapper ──────────────────────────────────────────────────────
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

// ── Mission Clock / Event Summary — first box, spans both rows ────────────────
function MissionClock({
  telemetry,
  stages = [],
  finalMetT = null,
  eventTimes = {},
}) {
  const t = (key) => (eventTimes[key] ? `T+${eventTimes[key]}` : "T+--:--:--");
  return (
    <PfPanel title="MISSION CLOCK / EVENTS" className="pf-mc pf-mc-tall">
      <div className="mc-countdown-label">TOTAL FLIGHT TIME</div>
      <div className="mc-countdown">
        {finalMetT ?? telemetry.metT ?? "--:--:--"}
      </div>
      <div className="mc-grid">
        <div className="mc-cell">
          <div className="label">Apogee Time</div>
          <div className="val">{t("APOGEE")}</div>
        </div>
        <div className="mc-cell">
          <div className="label">Drogue Deploy</div>
          <div className="val">{t("DROGUE")}</div>
        </div>
        <div className="mc-cell">
          <div className="label">Main Chute</div>
          <div className="val">{t("MAIN")}</div>
        </div>
        <div className="mc-cell">
          <div className="label">Boost Start</div>
          <div className="val">{t("BOOST")}</div>
        </div>
      </div>
      <div className="pfevt-section-label">MISSION TIMESTAMPS</div>
      <FlightTimeline stages={stages} />
    </PfPanel>
  );
}

// ── Flight Summary — max altitude hero + avg/max/min table ────────────────────
const fmt1 = (v) => (v == null ? "—" : Math.round(v).toLocaleString());

const SUMMARY_ROWS = [
  { key: "velocity", label: "SPEED", unit: "m/s" },
  { key: "pressure", label: "PRESSURE", unit: "hPa" },
  { key: "temp", label: "TEMP", unit: "°C" },
  { key: "acceleration", label: "ACCEL", unit: "m/s²" },
];

function FlightSummary({ flightStats }) {
  const altMax = flightStats?.altitude?.max ?? null;
  return (
    <div className="pf-summary">
      <div className="pfs-head">
        <span className="pf-panel-title">FLIGHT SUMMARY</span>
      </div>
      <div className="pfs-alt-block">
        <div className="pfs-alt-label">MAX ALTITUDE</div>
        <div className="pfs-alt-value">
          {altMax != null ? Math.round(altMax).toLocaleString() : "—"}
        </div>
        <div className="pfs-alt-unit">m</div>
      </div>
      <div className="pfs-divider" />
      <div className="pfs-table">
        <div className="pfs-thead">
          <span />
          <span>AVG</span>
          <span>MAX</span>
          <span>MIN</span>
        </div>
        {SUMMARY_ROWS.map(({ key, label, unit }) => {
          const s = flightStats?.[key];
          return (
            <div key={key} className="pfs-row">
              <span className="pfs-row-label">
                {label}
                <span className="pfs-unit"> {unit}</span>
              </span>
              <span>{fmt1(s?.avg)}</span>
              <span className="pfs-hi">{fmt1(s?.max)}</span>
              <span className="pfs-lo">{fmt1(s?.min)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sensor Detail — Altitude vs Time ─────────────────────────────────────────
function SensorDetail({ samples }) {
  return (
    <PfPanel title="ALTITUDE vs TIME" className="pf-sd">
      <div className="sd-matlab-slot">
        <AltitudeGraph samples={samples} />
      </div>
    </PfPanel>
  );
}

// ── Sensor Graphs — two donut gauges ─────────────────────────────────────────
// Gauge 1: peak temp as % of MS5607 max operating temp (85°C)
// Gauge 2: min pressure as % of sea-level pressure (1013.25 hPa) —
//          lower value = higher altitude reached
function SensorGraphs({ telemetry, flightStats }) {
  const peakTemp = flightStats?.temp?.max ?? telemetry.temp;
  const minPressure = flightStats?.pressure?.min ?? telemetry.pressure;

  const tempPct = Math.min(100, Math.max(0, (peakTemp / 85) * 100));
  const pressPct = Math.min(100, Math.max(0, (minPressure / 1013.25) * 100));

  return (
    <PfPanel title="SENSOR SUMMARY" className="pf-sg">
      <div className="sg-bottom">
        <DonutGauge
          value={tempPct}
          label="PEAK TEMP"
          sublabel="% of sensor max"
          color="var(--crim2)"
        />
        <DonutGauge
          value={pressPct}
          label="MIN PRESSURE"
          sublabel="% of sea level"
          color="var(--green)"
        />
      </div>
    </PfPanel>
  );
}

// ── Trajectory — landing coordinates + map placeholder ────────────────────────
function Trajectory({ telemetry }) {
  // ดึงค่าพิกัดพิกัดละติจูดและลองจิจูด
  const lat = telemetry?.lat ?? 0;
  const lon = telemetry?.lon ?? 0;

  // ตรวจจับว่าได้รับสัญญาณ GPS (พิกัดพ้นจากจุด 0,0) แล้วหรือยัง
  const hasGpsFix = lat !== 0 && lon !== 0;

  // ใช้ Google Maps Embed URL ค้นหาพิกัดและแสดงผลแบบ Hybrid (ดาวเทียม + ชื่อสถานที่ [t=h])
  // ซูมระดับ z=16 กำลังเหมาะสำหรับการมองเห็นจุดลงจอดจรวดรอบๆ
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=h&z=16&output=embed`;

  return (
    <PfPanel title="FINAL TRAJECTORY / LANDING SITE" className="pf-traj">
      <div className="traj-map h-[300px] w-full rounded border border-gray-800 overflow-hidden relative bg-black/50">
        {hasGpsFix ? (
          <iframe
            title="Rocket Landing Site Map"
            src={mapUrl}
            width="100%"
            height="100%"
            style={{
              border: 0,
              // 💡 CSS Filter ตัวนี้จะทำการอินเวิร์ตสีแผนที่มาตรฐานของ Google ให้กลายเป็น "ธีมมืด" เข้ากับเว็บของคุณ
              // หากต้องการแสดงผลสีแผนที่ดาวเทียมตามธรรมชาติแบบปกติ สามารถนำบรรทัด filter นี้ออกได้เลยครับ
              filter:
                "brightness(0.8) contrast(1.2) invert(90%) hue-rotate(180deg)",
            }}
            allowFullScreen=""
            loading="lazy"
          />
        ) : (
          /* หากสัญญาณ GPS ยังไม่ระบุตำแหน่ง (0,0) จะแสดงสถานะสัญลักษณ์จำลองรอพิกัด */
          <div className="pf-placeholder absolute inset-0 flex items-center justify-center">
            <div className="pf-placeholder-corner tl" />
            <div className="pf-placeholder-corner tr" />
            <div className="pf-placeholder-corner bl" />
            <div className="pf-placeholder-corner br" />
            <div className="text-center animate-pulse">
              <div className="pf-placeholder-title text-orange-500 font-mono tracking-widest">
                WAITING GPS FIX
              </div>
              <div className="pf-placeholder-sub text-gray-500 text-[10px] uppercase mt-1">
                NO VALID TELEMETRY SIGNAL DECODED
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ส่วนแสดงข้อมูลสถิติตัวเลขด้านล่างแผนที่ */}
      <div className="traj-stats font-mono">
        <div className="k">LAT</div>
        <div className="v">: {telemetry?.lat?.toFixed(6) ?? "—"}</div>
        <div className="k">LONG</div>
        <div className="v">: {telemetry?.lon?.toFixed(6) ?? "—"}</div>
        <div className="k">ALT</div>
        <div className="v">
          : {telemetry?.altitude?.toLocaleString() ?? "—"} m
        </div>
        <div className="k">VEL</div>
        <div className="v">
          : {telemetry?.velocity?.toLocaleString() ?? "—"} m/s
        </div>
      </div>
    </PfPanel>
  );
}

// ── Graph Triple — velocity / acceleration / temp+pressure ───────────────────
function GraphTriple({ samples }) {
  const panels = [
    { title: "VELOCITY vs TIME", Graph: VelocityGraph },
    { title: "ACCELERATION vs TIME", Graph: AccelerationGraph },
    { title: "TEMP & PRESSURE", Graph: TempPressureGraph },
  ];
  return (
    <div className="pf-graph-col">
      {panels.map(({ title, Graph }) => (
        <div key={title} className="pf-panel pf-graph-mini">
          <div className="pf-panel-head">
            <span className="pf-panel-title">{title}</span>
            <span className="pf-panel-bracket" />
          </div>
          <div className="pf-panel-body">
            <div className="pf-graph-slot">
              <Graph samples={samples} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Flight Timeline — stage events with T+ timestamps ────────────────────────
// stageTimes will be wired once real event timestamps are tracked.
// Format per row: ● STAGE NAME ─────── T+HH:MM:SS
const DOT_STATE = { armed: "armed", done: "done", unarmed: "" };

function FlightTimeline({ stages = [] }) {
  return (
    <div className="pf-timeline">
      <div className="pfevt-grid">
        {stages.map(({ id, label, state }) => (
          <div key={id} className="pfevt-row">
            <div className={`pfevt-dot ${DOT_STATE[state] ?? ""}`} />
            <span className="pfevt-label">{label}</span>
            <div className="pfevt-line" />
            <span className="pfevt-time placeholder">T+--:--:--</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut gauge ───────────────────────────────────────────────────────────────
function DonutGauge({ value, label, sublabel, color = "var(--crim2)" }) {
  const r = 46,
    cx = 70,
    cy = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * c;
  return (
    <div className="sg-donut">
      <svg width="120" height="120" viewBox="0 0 140 140">
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
          stroke={color}
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
          {Math.round(pct)}
          <tspan fontSize="14" fill="#9888a8">
            %
          </tspan>
        </text>
      </svg>
      {label && <div className="sg-donut-label">{label}</div>}
      {sublabel && <div className="sg-donut-sub">{sublabel}</div>}
    </div>
  );
}

// ── PowerMeter — kept for future SensorDetail use ────────────────────────────
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
