import Clock from './Clock'

export default function StatusBar({ telemetry = {} }) {
  const {
    currentState   = 'Far Field Pointing Deorbit',
    burnStatus     = 'Burn Enabled',
    pointingMode   = 'Sun + GEO',
    gpsStatus      = 'GPS ▲',
    velocity       = '22.3K / 6600',
    groundStation  = 'GND TBE',
  } = telemetry

  return (
    <div id="statusbar">
      <div className="sb-seg">
        <div className="sb-lbl">Current State</div>
        <div className="sb-val">{currentState}</div>
      </div>
      <div className="sb-seg">
        <div className="sb-lbl">Trunk Jettison and Deorbit</div>
        <div className="sb-val hi">{burnStatus}</div>
      </div>
      <div className="sb-seg">
        <div className="sb-lbl">Pointing Mode</div>
        <div className="sb-val">{pointingMode}</div>
      </div>
      <div className="sb-right">
        <span style={{ color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: 9 }}>{gpsStatus}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9 }}>{velocity}</span>
        <span style={{ color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: 9 }}>{groundStation}</span>
        <span className="sb-clock"><Clock /></span>
      </div>
    </div>
  )
}
