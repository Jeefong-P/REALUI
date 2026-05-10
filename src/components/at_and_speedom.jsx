function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

export default function ArcGauge({
  value = 0,
  max = 100,
  title = "SPEED",
  unit = "KM/H",
  size = 220,
  redZone = true,
}) {
  const v = Number(value) || 0;
  const safe = Math.min(Math.max(v, 0), max);

  const center = size / 2;
  const radius = size * 0.36;
  const stroke = size * 0.055;
  const startAngle = -120;
  const endAngle = 120;
  const totalAngle = endAngle - startAngle;
  const redSize = totalAngle * 0.15;
  const redStart = endAngle - redSize;
  const valueAngle = startAngle + (safe / max) * totalAngle;

  const titleFs = Math.max(9, size * 0.075);
  const valueFs = size * 0.22;
  const unitFs = Math.max(8, size * 0.07);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path
        d={describeArc(center, center, radius, startAngle, redZone ? redStart - 2 : endAngle)}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        style={{ stroke: "rgba(255, 255, 255, 0.09)" }}
      />
      {redZone && (
        <path
          d={describeArc(center, center, radius, redStart, endAngle)}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ stroke: "var(--crimson)" }}
        />
      )}
      {safe > 0 && (
        <path
          d={describeArc(center, center, radius, startAngle, valueAngle)}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ stroke: "var(--gold)" }}
        />
      )}
      <text
        x={center}
        y={center + valueFs * 0.1}
        textAnchor="middle"
        fontSize={valueFs}
        fontWeight="700"
        style={{ fill: "var(--bright)", fontFamily: "var(--mono)" }}
      >
        {Math.round(v)}
      </text>
      <text
        x={center}
        y={center + valueFs * 0.7}
        textAnchor="middle"
        fontSize={unitFs}
        letterSpacing="0.12em"
        style={{ fill: "var(--dim)", fontFamily: "var(--ui)" }}
      >
        {unit}
      </text>
      <text
        x={center}
        y={center - radius * 0.55}
        textAnchor="middle"
        fontSize={titleFs}
        letterSpacing="0.18em"
        fontWeight="700"
        style={{ fill: "var(--dim)", fontFamily: "var(--ui)" }}
      >
        {title}
      </text>
    </svg>
  );
}
