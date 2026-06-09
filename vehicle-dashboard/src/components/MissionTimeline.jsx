const DEFAULT_STAGES = [
  { id: 0, label: "BOOST",  state: "unarmed" },
  { id: 1, label: "COAST",  state: "unarmed" },
  { id: 2, label: "APOGEE", state: "unarmed" },
  { id: 3, label: "DROGUE", state: "unarmed" },
  { id: 4, label: "MAIN",   state: "unarmed" },
];

export default function MissionTimeline({ stages = DEFAULT_STAGES }) {
  return (
    <div className="mt-wrap">
      {stages.map((stage) => (
        <div key={stage.id} className={`mt-row ${stage.state}`}>
          <div className="mt-dot" />
          <div className="mt-label">{stage.label}</div>
        </div>
      ))}
    </div>
  );
}
