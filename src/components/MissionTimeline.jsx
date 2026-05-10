const DEFAULT_STAGES = [
  { id: 0, label: "PHD1", state: "armed" },
  { id: 1, label: "PHD1", state: "armed" },
  { id: 2, label: "PHD1", state: "armed" },
  { id: 3, label: "PHD1", state: "unarmed" },
  { id: 4, label: "PHD1", state: "unarmed" },
  { id: 5, label: "PHD1", state: "unarmed" },
  { id: 6, label: "PHD1", state: "unarmed" },
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
