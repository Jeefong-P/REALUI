export default function RightList() {
  return (
    <div id="right-list" className="rocket-detail">
      <div className="rd-head">
        <div className="rd-title-row">
          <span className="rd-title">CURSR-V</span>
          <img src="/cuharlogo.png" alt="" className="rd-logo" />
        </div>
        <div className="rd-tag">[CURSR-V]</div>
        <div className="rd-meta">
          <div className="rd-meta-item">
            <span className="rd-meta-lbl">Weight</span>
            <span className="rd-meta-val">Unknown kg</span>
          </div>
          <div className="rd-meta-item">
            <span className="rd-meta-lbl">Height</span>
            <span className="rd-meta-val">xxx m</span>
          </div>
        </div>
      </div>

      <div className="rd-section-title">Detailed Rocket Architecture</div>

      <div className="rd-cutaway">
        <span className="rd-placeholder">โมเดลผ่าครึ่ง</span>
      </div>

      <div className="rd-bottom">
        <div className="rd-box rd-box-detail">
          <span className="rd-box-lbl">Detail in Picture</span>
          <span className="rd-placeholder">[ ]</span>
        </div>
        <div className="rd-box rd-box-map">
          <span className="rd-box-lbl">Launch Site</span>
        </div>
      </div>
    </div>
  );
}
