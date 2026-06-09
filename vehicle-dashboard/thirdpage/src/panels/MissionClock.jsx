// Mission Clock / Countdown
const MissionClock = ({ countdown, telemetry }) => {
  const fmt = (n) => String(n).padStart(2, "0");
  const h = Math.floor(countdown / 3600);
  const m = Math.floor((countdown % 3600) / 60);
  const s = countdown % 60;

  return (
    <div className="panel">
      <h2>**เวลาทั้งหมด</h2>
      <div className="body">
        <div className="mc-countdown-label">Total flight time</div>
        <div className="mc-countdown">
          {fmt(h)}:{fmt(m)}:{fmt(s)}
        </div>
        <div className="mc-grid">
          <div className="mc-cell">
            <div className="label">Distance</div>
            <div className="val">{telemetry.dist} KM</div>
          </div>
          <div className="mc-cell">
            <div className="label">Average speed</div>
            <div className="val">{telemetry.vel.toLocaleString()} KM/H</div>
          </div>
          <div className="mc-cell">
            <div className="label">Sunset in</div>
            <div className="val">45 MINS</div>
          </div>
          <div className="mc-cell">
            <div className="label">Next Transmission in</div>
            <div className="val">1 HOUR</div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.MissionClock = MissionClock;
