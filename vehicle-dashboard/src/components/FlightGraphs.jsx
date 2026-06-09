import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const MAX_POINTS = 400;

function downsample(samples) {
  if (samples.length <= MAX_POINTS) return samples;
  const step = Math.ceil(samples.length / MAX_POINTS);
  return samples.filter((_, i) => i % step === 0);
}

const CHART_MARGIN = { top: 4, right: 8, left: 0, bottom: 0 };

const AXIS_STYLE = {
  fontFamily: "var(--mono)",
  fontSize: 8,
  fill: "var(--dim)",
};

const GRID_COLOR = "rgba(255,255,255,0.05)";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fg-tooltip">
      <div className="fg-tt-time">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="fg-tt-row" style={{ color: p.color }}>
          {p.name}: <span>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AltitudeGraph({ samples = [] }) {
  const data = useMemo(() => downsample(samples), [samples]);
  if (!data.length) return <EmptyGraph label="NO DATA" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="metT" tick={AXIS_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={38} unit=" m" />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="altitude"
          name="Alt"
          stroke="var(--gold)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function VelocityGraph({ samples = [] }) {
  const data = useMemo(() => downsample(samples), [samples]);
  if (!data.length) return <EmptyGraph label="NO DATA" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="metT" tick={AXIS_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={30} unit=" m/s" />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="velocity"
          name="Vel"
          stroke="#7eb8f7"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AccelerationGraph({ samples = [] }) {
  const data = useMemo(() => downsample(samples), [samples]);
  if (!data.length) return <EmptyGraph label="NO DATA" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="metT" tick={AXIS_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={34} unit=" m/s²" />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="acceleration"
          name="Accel"
          stroke="var(--crim2)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TempPressureGraph({ samples = [] }) {
  const data = useMemo(() => downsample(samples), [samples]);
  if (!data.length) return <EmptyGraph label="NO DATA" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ ...CHART_MARGIN, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="metT" tick={AXIS_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
        <YAxis yAxisId="t" tick={AXIS_STYLE} tickLine={false} axisLine={false} width={28} unit="°C" />
        <YAxis yAxisId="p" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} width={36} unit=" hPa" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={6}
          wrapperStyle={{ fontFamily: "var(--mono)", fontSize: 7, color: "var(--dim)" }}
        />
        <Line yAxisId="t" type="monotone" dataKey="temp" name="Temp" stroke="var(--gold2)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line yAxisId="p" type="monotone" dataKey="pressure" name="Press" stroke="var(--green)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyGraph({ label }) {
  return (
    <div className="fg-empty">
      <span>{label}</span>
    </div>
  );
}
