const CONNECTIONS = [
  ["AIRBRAKE", "Connected"],
  ["MAIN", "Connected"],
  ["DROGE", "Connected"],
  ["AIRTAGS", "Connected"],
];

export default function LeftData({ telemetry = {} }) {
  const { connections = CONNECTIONS } = telemetry;

  return (
    <div id="left-data">
      <div className="conn-section">
        <div className="conn-title">Connections</div>
        {connections.map(([name, val], i) => (
          <div key={i} className="conn-row">
            <span className="conn-name">{name}</span>
            <span className="conn-val">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
