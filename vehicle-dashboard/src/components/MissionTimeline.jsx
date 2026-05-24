const DEFAULT_STAGES = [
  { id: 0, label: "LAUNCH", state: "unarmed" },
  { id: 1, label: "xxx", state: "unarmed" },
  { id: 2, label: "xxx", state: "unarmed" },
  { id: 3, label: "xxx", state: "unarmed" },
  { id: 4, label: "xxxx", state: "unarmed" },
  { id: 5, label: "LANDED", state: "unarmed" },
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
